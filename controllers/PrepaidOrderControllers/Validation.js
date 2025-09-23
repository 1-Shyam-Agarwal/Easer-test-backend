const usersCollection = require('../../models/Users.js');


exports.validateOrderAndPriceGeneration = async (req, res) => {
    try {
        const { filesWithConfigs } = req.body;

        const { id } = req.tokenPayload;
        const userID = id;

        let vendorID = req.body.vendorID;
        vendorID = "b53bc873-91d4-4028-bde6-f67eabab6c83"   //temporary

        if (!userID) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the userID',
            });
        }

        if (!vendorID) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the vendorID',
            });
        }

        if(!filesWithConfigs)
        {
            return res.status(400).json({
                success: false,
                message: 'Please specify the files.',
            });
        }

        if (!Array.isArray(filesWithConfigs)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid files',
            });
        }

        if (filesWithConfigs?.length<=0 || filesWithConfigs?.length>25) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the files. Maximum 25 files are allowed',
            });
        }

        for (let i = 0; i < filesWithConfigs.length; i++) {
            if (typeof filesWithConfigs[i] === 'object') {
                console.log(Object.keys(filesWithConfigs[i]).length );
                if (Object.keys(filesWithConfigs[i]).length === 11) {
                    if (
                        'file' in filesWithConfigs[i] &&
                        'fileConfigs' in filesWithConfigs[i] &&
                        'fileSize' in filesWithConfigs[i] &&
                        'file_id' in filesWithConfigs[i] &&
                        'file_ref' in filesWithConfigs[i] &&
                        'name' in filesWithConfigs[i] &&
                        'pageCount' in filesWithConfigs[i] &&
                        'progress' in filesWithConfigs[i] &&
                        'uploading' in filesWithConfigs[i] &&
                        'url' in filesWithConfigs[i] &&
                        'fileType' in filesWithConfigs[i]
                    ) {
                        if(filesWithConfigs[i].fileType !== "application/pdf")
                        {
                            return res.status(400).json({
                                success: false,
                                message: "Only PDFs are allowed",
                            });
                        }

                        if(filesWithConfigs[i].fileSize > 30*1024*1024)
                        {   
                            return res.status(400).json({
                                success: false,
                                message: "File size should be less than 30MB",
                            });
                        }

                    } else {
                        return res.status(400).json({
                            success: false,
                            message: "Files doesn't contain required field",
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Files should have length equal to 11 .',
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Files should be object.',
                });
            }
        }

        for (let i = 0; i < filesWithConfigs.length; i++) {

            const fileConfigs = filesWithConfigs[i].fileConfigs;

            if (typeof fileConfigs === 'object') {
                if (Object.keys(fileConfigs).length === 4) {
                    if (
                        'backToBack' in fileConfigs &&
                        'color' in fileConfigs &&
                        'copies' in fileConfigs &&
                        'orientation' in fileConfigs 
                    ) {} 
                    else {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Fileconfigs doesn't contain required field",
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Fileconfigs should have length equal to 4',
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Fileconfigs should be object',
                });
            }
        }

        // checking whether vendor is valid or not
        const isVendorValid = await usersCollection
            .findOne({ userId: vendorID, role: 'vendor' })
            .select('-_id vendorAdditionalDetails collegeCode')
            .populate({
                path: 'vendorAdditionalDetails',
                select: '-_id priceSchema',
            });

        if (!isVendorValid) {
            return res.status(400).json({
                success: false,
                message: "Such Vendor doesn't exists",
            });
        }

        // checking whether user is valid or not
        const isUserValid = await usersCollection.findOne({
            role: 'customer',
            _id: userID,
        });

        if (!isUserValid) {
            return res.status(400).json({
                success: false,
                message: "Such User doesn't exists",
            });
        }

        if (!isUserValid.collegeCode.equals(isVendorValid.collegeCode)) {
            return res.status(400).json({
                success: false,
                message:
                    "Order can't be placed as user and vendor belongs to differet College",
            });
        }

        //Checking the price with original price
        // const priceDetails = await priceModel
        //     .findOne({ _id: isVendorValid.vendorAdditionalDetails.priceSchema })
        //     .select('-_id -vendor');

        let price = 0;
        let number_of_ss_prints_bw = 0;
        let number_of_bb_prints_bw = 0;
        let number_of_ss_prints_c = 0;
        let number_of_bb_prints_c = 0;



        //Counting the pages
        for(let i=0 ; i<filesWithConfigs.length ; i++)
        {
            const fileConfigs = filesWithConfigs[i].fileConfigs;
            if(fileConfigs.color === "colored")
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
        let total_c_cost = (number_of_ss_prints_c + number_of_bb_prints_c)*15;

        // let applicablePriceSchema_BW_SS =[];
        // let applicablePriceSchema_BW_BB =[];
        // let applicablePriceSchema_C_SS =[];
        // let applicablePriceSchema_C_BB =[];

        let applicablePriceSchema_BW = [];
        let applicablePriceSchema_C = [15, "perPrint"];

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

            vendor : vendorID
        }


        return res.status(200).json({
            success:true,
            message:"Invoice is fetched successfully",
            invoice
        })

    } catch (error) {
        console.log('Error occured while validating and creating the invoice for  the order : ', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error: error.message,
        });
    }
};

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




