const { v4: uuidv4 } = require('uuid');
const onGoingOrders = require('../../models/OrderTypes/OngoingOrders.js');
const usersCollection = require('../../models/Users.js');

exports.createOrder = async (req, res) => {
    const customerId = req.tokenPayload.id;

    try {
        const {
            vendorID,
            filesWithConfigs,
            price,
            orderId,
            paymentId,
            bankReferenceNumber,
            paymentTime,
        } = req.body;

        console.log('custoemrkfn oreder creation : ', req.body);

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the userId.',
            });
        }

        //   if(!vendorID)
        //   {
        //     return res.status(400).json({
        //       success : false,
        //       message : "Please specify the vendorID"
        //     })
        //   }

        //   if(!files)
        //   {
        //     return res.status(400).json({
        //       success : false,
        //       message : "Please specify the files."
        //     })
        //   }

        //   if(!Array.isArray(files))
        //   {
        //     return res.status(400).json({
        //       success : false,
        //       message : "Invalid files"
        //     })
        //   }

        //   if(!(files.length>0))
        //   {
        //     return res.status(400).json({
        //       success : false,
        //       message : "Files' length can't be zero"
        //     })
        //   }

        //   if(!fileConfigs)
        //     {
        //       return res.status(400).json({
        //         success : false,
        //         message : "Please specify the fileConfigs."
        //       })
        //     }

        //     if(!Array.isArray(fileConfigs))
        //     {
        //       return res.status(400).json({
        //         success : false,
        //         message : "Invalid fileConfigs"
        //       })
        //     }

        //     if(!(fileConfigs.length>0))
        //     {
        //       return res.status(400).json({
        //         success : false,
        //         message : "FileConfigs' length can't be zero"
        //       })
        //     }

        //     if(!price)
        //     {
        //       return res.status(400).json({
        //         success : false,
        //         message : "Please specify price."
        //       })
        //     }

        //     if(typeof price !== "number")
        //     {
        //         return res.status(400).json({
        //           success : false,
        //           message : "Invalid price."
        //         })
        //     }

        //     if(!(price>0))
        //     {
        //         return res.status(400).json({
        //           success : false,
        //           message : "Price can't be less than or equal to zero"
        //         })
        //     }

        //     if(files.length !== fileConfigs.length)
        //     {
        //       return res.status(400).json({
        //         success : false,
        //         message : "Files' length and Fileconfigs' length can't be different"
        //       })
        //     }

        //     for(let i=0 ; i<files.length ; i++)
        //     {
        //         if(typeof files[i] === "object")
        //         {

        //           if(Object.keys(files[i]).length===3)
        //           {
        //               if("fileName" in files[i] && "public_id" in files[i] && "secure_url" in files[i]){}
        //               else
        //               {

        //                 return res.status(400).json({
        //                   success : false,
        //                   message : "Files doesn't contain required field"
        //                 })
        //               }

        //           }
        //           else{
        //             return res.status(400).json({
        //               success : false,
        //               message : "Files should have length equal to 3 ."
        //             })
        //           }

        //         }
        //         else
        //         {

        //           return res.status(400).json({
        //             success : false,
        //             message : "Files should be object."
        //           })
        //         }
        //     }

        //     for(let i=0 ; i<fileConfigs.length ; i++)
        //     {
        //         if(typeof fileConfigs[i] === "object")
        //         {
        //           if(Object.keys(fileConfigs[i]).length===6)
        //           {
        //               if("backToBack" in fileConfigs[i] && "color" in fileConfigs[i] && "copies" in fileConfigs[i] && "numberOfPages" in fileConfigs[i] && "orientation" in fileConfigs[i] && "specialRequest" in fileConfigs[i]){}
        //               else
        //               {

        //                 return res.status(400).json({
        //                   success : false,
        //                   message : "Fileconfigs doesn't contain required field"
        //                 })
        //               }

        //           }
        //           else{

        //             return res.status(400).json({
        //               success : false,
        //               message : "Fileconfigs should have length equal to 6"
        //             })
        //           }

        //         }
        //         else
        //         {

        //           return res.status(400).json({
        //             success : false,
        //             message : "Fileconfigs should be object"
        //           })
        //         }
        //     }

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment id is required.',
            });
        }

        if (!bankReferenceNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bank reference number is required.',
            });
        }
        // if(!["offline" , "online"].includes(paymentMode))
        // {
        //     return res.status(400).json({
        //         success : false,
        //         message : "Please Specify the Correct Payment Mode"
        //     })
        // }

        // if(!["pending" , "paid"].includes(paymentStatus))
        // {
        //     return res.status(400).json({
        //         success : false,
        //         message : "Please Specify the Correct Payment Status"
        //     })
        // }

        // if(paymentMode ==="offline")
        // {
        //     if(paymentStatus!=="pending")
        //     {
        //         return res.status(400).json({
        //             success : false,
        //             message : "Paymentmode and Paymentstatus are contradictory"
        //         })
        //     }
        // }
        // else
        // {
        //     if(paymentStatus!=="paid")
        //     {
        //         return res.status(400).json({
        //             success : false,
        //             message : "Paymentmode and Paymentstatus are contradictory"
        //         })
        //     }

        // }

        //creating UUID
        const orderID = uuidv4();

        if (!orderID) {
            return res.status(500).json({
                success: false,
                message:
                    'Unable to generate OrderId due to some Technical Issue',
            });
        }

        // checking whether vendor is valid or not
        const isVendorValid = await usersCollection
            .findOne({ userId: vendorID, role: 'vendor' })
            .select('_id vendorAdditionalDetails')
            .populate({
                path: 'vendorAdditionalDetails',
                select: '-_id priceSchema shopName shopLandMark',
            });

        if (!isVendorValid) {
            return res.status(400).json({
                success: false,
                message: "Such Vendor doesn't exists",
            });
        }

        const isUserValid = await usersCollection
            .findOne({ _id: customerId, role: 'customer' })
            .select('firstName lastName email mobileNumber userId');

        if (!isUserValid) {
            return res.status(400).json({
                success: false,
                message: "Such User doesn't exists",
            });
        }

        //   //Checking the price with original price
        //   const priceDetails = await priceModel.findOne({_id:isVendorValid.vendorAdditionalDetails.priceSchema})
        //                                            .select("-_id -vendor");

        //     let original_price = 0;
        //     let numberofBlackAndWhitePrints_SingleSide = 0;
        //     let numberofBlackAndWhitePrints_BackToBack = 0;
        //     let numberofColoredPrints = 0;

        //     const singleSide_BlackAndWhite_1 = priceDetails.singleSide_BlackAndWhite_1;
        //     const singleSide_BlackAndWhite_2_5Includes5 = priceDetails.singleSide_BlackAndWhite_2_5Includes5;
        //     const singleSide_BlackAndWhite_Above5 = priceDetails.singleSide_BlackAndWhite_Above5;
        //     const backToBack_BlackAndWhite_LessThanEqualTo_4 = priceDetails.backToBack_BlackAndWhite_LessThanEqualTo_4;
        //     const backToBack_BlackAndWhite_5_10Includes10 = priceDetails.backToBack_BlackAndWhite_5_10Includes10;
        //     const backToBack_BlackAndWhite_MoreThan_10 = priceDetails.backToBack_BlackAndWhite_MoreThan_10;
        //     const colorPrice = priceDetails.colorPrint;

        //     //Counting the pages
        //     for(let i=0 ; i<fileConfigs.length ; i++)
        //     {

        //         if(fileConfigs[i].color === "colored")
        //         {
        //             numberofColoredPrints+=((fileConfigs[i].numberOfPages)*fileConfigs[i].copies);
        //         }
        //         else
        //         {
        //             if(fileConfigs[i].backToBack)
        //             {
        //                 numberofBlackAndWhitePrints_BackToBack+=((fileConfigs[i].numberOfPages)*fileConfigs[i].copies);
        //             }
        //             else
        //             {
        //                 numberofBlackAndWhitePrints_SingleSide+=((fileConfigs[i].numberOfPages)*fileConfigs[i].copies);
        //             }
        //         }
        //     }

        //     //Calculating the Price

        //     //Including price of color Printouts
        //     original_price+= numberofColoredPrints*colorPrice;

        //     //Including the BackToBack BW Printouts
        //     if(numberofBlackAndWhitePrints_BackToBack <=4) original_price+= numberofBlackAndWhitePrints_BackToBack*backToBack_BlackAndWhite_LessThanEqualTo_4;
        //     else if(numberofBlackAndWhitePrints_BackToBack >4 && numberofBlackAndWhitePrints_BackToBack<11) original_price+=  numberofBlackAndWhitePrints_BackToBack*backToBack_BlackAndWhite_5_10Includes10;
        //     else if(numberofBlackAndWhitePrints_BackToBack >10) original_price+= numberofBlackAndWhitePrints_BackToBack*backToBack_BlackAndWhite_MoreThan_10;

        //     //Including the cost of Single Side BW printouts
        //     if(numberofBlackAndWhitePrints_SingleSide === 1) original_price+= numberofBlackAndWhitePrints_SingleSide * singleSide_BlackAndWhite_1;
        //     else if(numberofBlackAndWhitePrints_SingleSide>=2 && numberofBlackAndWhitePrints_SingleSide<=5 ) original_price+= numberofBlackAndWhitePrints_SingleSide * singleSide_BlackAndWhite_2_5Includes5;
        //     else if(numberofBlackAndWhitePrints_SingleSide>5) original_price+= numberofBlackAndWhitePrints_SingleSide * singleSide_BlackAndWhite_Above5;

        //     if(price !== original_price)
        //     {
        //       return res.status(400).json({
        //         success : false,
        //         message : "Price is altered."
        //       })
        //     }

        // then creating the entry in the onGoing DB
        const onGoingDBResponse = await onGoingOrders.create({
            user: isUserValid._id,
            vendor: isVendorValid._id,
            documents: filesWithConfigs,
            price,
            orderId,
            paymentId,
            bankReferenceNumber,
            paymentTime,
        });

        return res.status(200).json({
            success: true,
            message: 'Order created Successfully',
        });
    } catch (e) {
        console.log('Error occured while creating the order : ', e);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error: e.message,
        });
    }
};
