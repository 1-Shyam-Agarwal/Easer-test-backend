const usersCollection = require("../../models/Users.js");
const priceModel  = require("../../models/priceSchema.js");

exports.getFilteredVendorsController = async(req,res)=>
    {
        try
        {
            //Extract the data from the req.
            const{id , role } =req.tokenPayload;
    
            //Then validate the payload
            if(!id || !role)
            {
                return res.status(400).json({
                    success : false,
                    message :"Id or Role is missing."
                })
            }
    
            if(!["user" , "vendor"].includes(role))
            {
                return res.status(400).json({
                    success : false,
                    message :"Invalid Role"
                })
            }
    
            let userData = await usersCollection.findOne({_id : id , role});
    
            if(!userData)
            {
                return res.status(400).json({
                    success : false,
                    message :`Such ${role} doesn't exists`
                })
            }

            const response = await usersCollection.find({role : "vendor" , collegeCode : userData?.collegeCode})
                                       .select("-_id vendorAdditionalDetails profileImage userId")
                                       .populate({
                                            path : "vendorAdditionalDetails",
                                            select :"-_id shopName shopLandMark priceSchema fineSchema waitingTime",
                                            populate :[
                                                {
                                                    path : "priceSchema",
                                                    select :"-_id -vendor"
                                                },
                                                {
                                                    path:"fineSchema",
                                                    select :"-_id"
                                                }
                                            ] 
                                       });
    
            return res.status(200).json({
                success:true,
                message:"Data is fetched successfully",
                filteredVendors : response
            })
    
        }catch(e)
        {
            console.log("Error occured while fetching the filtered vendors : ",e);
            res.status(500).json({
                success :false,
                message : e.message
            })
        }
    }


exports.getFilteredVendorsWithMinimumDetailsController = async(req,res)=>
{
    try
    {
        //Extract the data from the req.
        const{id , role } =req.tokenPayload;

        //Then validate the payload

        if(!id || !role)
        {
            return res.status(400).json({
                success : false,
                message :"Id or Role is missing."
            })
        }

        if(!["user" , "vendor"].includes(role))
        {
            return res.status(400).json({
                success : false,
                message :"Invalid Role"
            })
        }

        let userData = await usersCollection.findOne({_id : id , role});

        if(!userData)
        {
            return res.status(400).json({
                success : false,
                message :`Such ${role} doesn't exists`
            })
        }

        const response = await usersCollection.find({role : "vendor" , collegeCode : userData?.collegeCode})
                                    .select("-_id userId vendorAdditionalDetails")
                                    .populate({
                                        path : "vendorAdditionalDetails",
                                        select :"-_id shopName shopLandMark"
                                    });

        return res.status(200).json({
            success:true,
            message:"Data is fetched successfully",
            filteredVendors : response
        })

    }catch(e)
    {
        console.log("Error occured while fetching the filtered vendors with minimum details : ",e);
        res.status(500).json({
            success :false,
            message : e.message
        })
    }
}


        
exports.validatePrintOrderVendor = async(req,res) =>
{
    try{

        //obtain data from the request body
        const vendor = req.body.vendor;

        // isEmpty validation

        if(!vendor)
        {
            return res.status(400).json({
                success  :false,
                message : "Please Select A Shop"
            })
        }

        // check whether id is correct or not

        const response = await usersCollection.findOne({userId : vendor , role :"vendor"});

        if(!response)
        {
            return res.status(400).json({
                success  :false,
                message : "Such Vendor doesn't Exists"
            })
        }
        
        return res.status(200).json({
            success  :true,
            message : "Vendor is successfully Validated"
        })

    }catch(e)
    {
        console.log("Error occured while validating vendors : ",e);
        return res.status(500).json({
            success  :false,
            message : e.message
        })
    }
}

exports.getAllVendorPriceDetails = async(req,res)=>
{
    try
    {

        const {vendorId } = req.body;
        let {filesWithConfigs} = req.body;

        if(!vendorId)
        {
            return res.status(400).json({
                success  :false,
                message : "Please Specify A shop"
            })
        }

        if(!(filesWithConfigs.length>0))
        {
            return res.status(400).json({
                success  :false,
                message : "Please Specify File Configurations"
            })

        }
        //validate the vendorId
        const isVendorValid =  await usersCollection.findOne({userId : vendorId})
                                         .select("-_id vendorAdditionalDetails")
                                         .populate({
                                            path:"vendorAdditionalDetails",
                                            select : "-_id priceSchema"
                                         });

        if(!isVendorValid)
        {
            return res.status(400).json({
                success  :false,
                message : "Such Vendor doesn't Exists"
            })
        }

        //extract the price details
        // const priceDetails = await priceModel.findOne({_id:isVendorValid.vendorAdditionalDetails.priceSchema})
        //                                  .select("-_id");
        

        let price = 0;
        let number_of_ss_prints_bw = 0;
        let number_of_bb_prints_bw = 0;
        let number_of_ss_prints_c = 0;
        let number_of_bb_prints_c = 0;



        //Counting the pages
        for(let i=0 ; i<filesWithConfigs.length ; i++)
        {
            if(filesWithConfigs[i].fileConfigs.color === "colored")
            {
                if(filesWithConfigs[i].backToBack)
                {
                    number_of_bb_prints_c+=((filesWithConfigs[i].pageCount)*filesWithConfigs[i].fileConfigs.copies);
                }
                else
                {
                    number_of_ss_prints_c+=((filesWithConfigs[i].pageCount)*filesWithConfigs[i].fileConfigs.copies);
                } 
            }
            else
            {
                if(filesWithConfigs[i].backToBack)
                {
                    number_of_bb_prints_bw+=((filesWithConfigs[i].pageCount)*filesWithConfigs[i].fileConfigs.copies);
                }
                else
                {
                    number_of_ss_prints_bw+=((filesWithConfigs[i].pageCount)*filesWithConfigs[i].fileConfigs.copies);
                } 
            }
        }


        let blackpages = number_of_ss_prints_bw + (Math.floor(number_of_bb_prints_bw/2)) +  (number_of_bb_prints_bw%2);

        let total_cost = 0;
        let total_bw_cost = 0;
        let total_c_cost = (number_of_ss_prints_c + number_of_bb_prints_c)*13;

        // let applicablePriceSchema_BW_SS =[];
        // let applicablePriceSchema_BW_BB =[];
        // let applicablePriceSchema_C_SS =[];
        // let applicablePriceSchema_C_BB =[];

        let applicablePriceSchema_BW = [];
        let applicablePriceSchema_C = [13, "perPrint"];

        if(blackpages==1)
        {
            total_bw_cost+=5;
            applicablePriceSchema_BW = [ 5  , "perPrint"];
        }
        else if(2<=blackpages && blackpages<=4) 
        {
            total_bw_cost+=10;
            applicablePriceSchema_BW = [10 , "combined"]
        }

        else if(blackpages>4)
        {

            total_bw_cost+=blackpages*2;
            applicablePriceSchema_BW = [2 , "perPrint"]
        }

        total_cost = total_bw_cost + total_c_cost;

        price = total_cost;

        //Calculating the Price

        //Including price of color Printouts
        //[]->at index 0 -> storing applicable price , at index 1 -> pricing mode
        

        // const priceSchema = priceDetails.priceSchema;



        //Calculating the price of singleSide black and white prints

        // if(numberofBlackAndWhitePrints_BackToBack === 1) 
        // {
        //     numberofBlackAndWhitePrints_BackToBack=0;
        //     numberofBlackAndWhitePrints_SingleSide=1;
        // }

        // if(numberofColoredPrints_backToBack===1)
        // {
        //     numberofColoredPrints_backToBack=0;
        //     numberofColoredPrints_SingleSide=1;
        // }

        // if(numberofBlackAndWhitePrints_SingleSide>0)
        // {
        //     for(let i=0 ; i<priceSchema.length;i++)
        //         {
        //             if(priceSchema[i].printingMethod === "singleSide" && priceSchema[i].colour==="blackAndWhite")
        //             {
        //                 if(priceSchema[i].rangeType==="above")
        //                 {
        //                     if(numberofBlackAndWhitePrints_SingleSide>priceSchema[i].aboveValue)
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_BW_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofBlackAndWhitePrints_SingleSide*applicablePriceSchema_BW_SS[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_BW_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_BW_SS[0];
        //                             break;
        //                         }
                                
        //                     }
        //                 }
        //                 if(priceSchema[i].rangeType==="range")
        //                 {
        //                     if((priceSchema[i].startingRange<= numberofBlackAndWhitePrints_SingleSide) && (priceSchema[i].endingRange>= numberofBlackAndWhitePrints_SingleSide))
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_BW_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofBlackAndWhitePrints_SingleSide*applicablePriceSchema_BW_SS[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_BW_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_BW_SS[0];
        //                             break;
        //                         }
        //                     }
        //                 }
                        
        //             }
        //         }
        // }
        
        // //Calculating the price of bothSide black and white prints
        // if(numberofBlackAndWhitePrints_BackToBack>0)
        // {
        //     for(let i=0 ; i<priceSchema.length;i++)
        //         {
        //             if(priceSchema[i].printingMethod === "backToBack" && priceSchema[i].colour==="blackAndWhite")
        //             {
        //                 if(priceSchema[i].rangeType==="above")
        //                 {
        //                     if(numberofBlackAndWhitePrints_BackToBack>priceSchema[i].aboveValue)
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_BW_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofBlackAndWhitePrints_BackToBack*applicablePriceSchema_BW_BB[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_BW_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_BW_BB[0];
        //                             break;
        //                         }
                                
        //                     }
        //                 }

        //                 if(priceSchema[i].rangeType==="range")
        //                 {
        //                     if((priceSchema[i].startingRange<= numberofBlackAndWhitePrints_BackToBack) && (priceSchema[i].endingRange>=numberofBlackAndWhitePrints_BackToBack))
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_BW_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofBlackAndWhitePrints_BackToBack*applicablePriceSchema_BW_BB[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_BW_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_BW_BB[0];
        //                             break;
        //                         }
        //                     }
        //                 }
                        
        //             }
        //         }
        // }

        // //Calculating the price of single Side Color print
        // if(numberofColoredPrints_SingleSide>0)
        // {
        //     for(let i=0 ; i<priceSchema.length;i++)
        //         {
        //             if(priceSchema[i].printingMethod === "singleSide" && priceSchema[i].colour==="colour")
        //             {
        //                 if(priceSchema[i].rangeType==="above")
        //                 {
        //                     if(numberofColoredPrints_SingleSide>priceSchema[i].aboveValue)
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_C_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofColoredPrints_SingleSide*applicablePriceSchema_C_SS[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_C_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_C_SS[0];
        //                             break;
        //                         }
                                
        //                     }
        //                 }

        //                 if(priceSchema[i].rangeType==="range")
        //                 {
        //                     if((priceSchema[i].startingRange<= numberofColoredPrints_SingleSide) && (priceSchema[i].endingRange>= numberofColoredPrints_SingleSide))
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_C_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofColoredPrints_SingleSide*applicablePriceSchema_C_SS[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_C_SS = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_C_SS[0];
        //                             break;
        //                         }
        //                     }
        //                 }
                        
        //             }
        //         }
        // }

        // if(numberofColoredPrints_backToBack>0)
        // {
        //     for(let i=0 ; i<priceSchema.length;i++)
        //         {
        //             if(priceSchema[i].printingMethod === "backToBack" && priceSchema[i].colour==="colour")
        //             {
        //                 if(priceSchema[i].rangeType==="above")
        //                 {
        //                     if(numberofColoredPrints_backToBack>priceSchema[i].aboveValue)
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_C_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofColoredPrints_backToBack*applicablePriceSchema_C_BB[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_C_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_C_BB[0];
        //                             break;
        //                         }
                                
        //                     }
        //                 }

        //                 if(priceSchema[i].rangeType==="range")
        //                 {
        //                     if((priceSchema[i].startingRange<= numberofColoredPrints_backToBack) && (priceSchema[i].endingRange>= numberofColoredPrints_backToBack))
        //                     {
        //                         if(priceSchema[i].pricingMethod === "perPrint")
        //                         {
        //                             applicablePriceSchema_C_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=numberofColoredPrints_backToBacknumberofColoredPrints_SingleSide*applicablePriceSchema_C_BB[0];
        //                             break;
        //                         }
        //                         else
        //                         {
        //                             applicablePriceSchema_C_BB = [priceSchema[i].price , priceSchema[i].pricingMethod];
        //                             price+=applicablePriceSchema_C_BB[0];
        //                             break;
        //                         }
        //                     }
        //                 }
                        
        //             }
        //         }
        // }



        const invoice={
            price :{
                price , 
                total_bw_cost,
                total_c_cost
            },

            pages : 
            {
                number_of_bb_prints_bw,
                number_of_ss_prints_bw,
                number_of_bb_prints_c,
                number_of_ss_prints_c,
            },

            priceSchema :
            {
                applicablePriceSchema_BW,
                applicablePriceSchema_C,
            },

            vendor : vendorId
        }


        return res.status(200).json({
            success:true,
            message:"Invoice is fetched successfully",
            invoice
        })

    }catch(e)
    {
        console.log("Error occured while calculating the price of a order : " , e);
        return res.status(500).json({
            success  :false,
            message : e.message
        })
    }
}

