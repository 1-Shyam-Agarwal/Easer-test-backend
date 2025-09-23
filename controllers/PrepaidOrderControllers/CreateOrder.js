const { v4: uuidv4 } = require('uuid');
const onGoingOrders = require('../../models/OrderTypes/OngoingOrders.js');
const usersCollection = require('../../models/Users.js');
const orderSummary = require("../../models/orderSummary.js");
const {Mutex}  = require('async-mutex');

const mutex = new Mutex();

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


        if (!customerId){
            return res.status(400).json({
                success: false,
                message: 'Please specify the customerId.',
            });
        }

        if(!vendorID)
        {
            return res.status(400).json({
                success : false,
                message : "Please specify the vendorID"
            })
        }

        if(!filesWithConfigs)
        {
            return res.status(400).json({
                success : false,
                message : "Please specify the files."
            })
        }

        if(!Array.isArray(filesWithConfigs))
        {
            return res.status(400).json({
                success : false,
                message : "Invalid files"
            })
        }

        if(!(filesWithConfigs.length>0))
        {
            return res.status(400).json({
                success : false,
                message : "Please specify the files."
            })
        }

        if(!price)
        {
            return res.status(400).json({
                success : false,
                message : "Please specify price."
            })
        }

        if(typeof price !== "number")
        {
            return res.status(400).json({
                success : false,
                message : "Invalid price."
            })
        }

        if(!(price>0))
        {
            return res.status(400).json({
              success : false,
              message : "Invalid price"
            })
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

        if(!paymentTime)
        {
            return res.status(400).json({
                success: false,
                message: 'Payment time  is required.',
            }); 
        }

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
        const [isVendorValid, isUserValid] = await Promise.all([
        usersCollection
            .findOne({ userId: vendorID, role: 'vendor' })
            .select('_id vendorAdditionalDetails')
            .populate({
            path: 'vendorAdditionalDetails',
            select: '-_id priceSchema shopName shopLandMark',
            }),
        usersCollection
            .findOne({ _id: customerId, role: 'customer' })
            .select('firstName lastName email mobileNumber userId'),
        ]);

        if (!isVendorValid) {
        return res.status(400).json({
            success: false,
            message: "Such Vendor doesn't exists",
        });
        }

        if (!isUserValid) {
        return res.status(400).json({
            success: false,
            message: "Such User doesn't exists",
        });
        }

        
        // *************************************************************
        //Verify_price_Api hit karni hai idhar


        //OTP generation

        //lana toh database mein se padega 

        //apply mutex and transaction

        const release = await mutex.acquire(); // acquire lock

        const today = new Date();
        today.setHours(0, 0, 0, 0); // store only date
        let summaryResponse

        try
        {
             summaryResponse = await orderSummary.findOneAndUpdate(
            { date: today, user: isVendorValid._id }, // match by date + user
            {
                $inc: { onGoingOrders: 1 },
                $setOnInsert: { date: today, user: isVendorValid._id }, // only set on creation
            },
            { new: true, upsert: true }
            );
        }
        catch(e)
        {
            console.log("Error occured while fetching order summary during creation of order : " , e);
            return res.status(500).json({
                success : false,
                message : e.message()
            })

        }
        finally{
            release();
        }

       

        let OTP;
        do{
             let starting = 1000 + 10 * (
            (summaryResponse.onGoingOrders > 0 ? summaryResponse.onGoingOrders - 1 : 0) +
            summaryResponse.UnreceivedOrders +
            summaryResponse.cancelledOrders +
            summaryResponse.orderHistory
            );

            let modification = Math.floor(Math.random() * 10); // random 0-9
            OTP = starting + modification;
            
        }while(OTP in summaryResponse.usedOTP)

        const ongoingOrderResponse = await onGoingOrders.find({vendor : isVendorValid._id , orderStatus :"waiting"})
                                                        .populate("user");

        let totalTime = 0;
        let pageCount = 0;
        
        const currentTime = new Date();
        
        let len = ongoingOrderResponse.length;

        ongoingOrderResponse.forEach(order => {

            let n = order.documents.length;

            for(let i=0 ; i<n ; i++)
            {
                pageCount +=order.documents[i].pageCount;
                console.log("pageCount : " , pageCount);
            }
            
        })

        

        totalTime = pageCount * 1.25; //in sec
        console.log("totalTime insec: " , totalTime);
        totalTime = Math.floor(totalTime / 60); //in mins
        totalTime = totalTime + len*0.75; //additional time of 10 mins

        console.log("totalTime : " , totalTime);


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
            otp:OTP,
            remainingTime : totalTime,
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
