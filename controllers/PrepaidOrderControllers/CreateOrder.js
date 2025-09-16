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

        console.log('custoemrkfn oreder creation : ', req.body);

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


        for(let i=0 ; i<filesWithConfigs.length ; i++)
        {
            if(typeof filesWithConfigs[i] === "object")
            {
                console.log("fileConfigs : " , filesWithConfigs[i]);
                if(Object.keys(filesWithConfigs[i]).length===9)
                {
                    if("file" in filesWithConfigs[i] && 
                       "name" in filesWithConfigs[i] && 
                       "progress" in filesWithConfigs[i] &&
                       "file_id" in filesWithConfigs[i] &&
                       "file_ref" in filesWithConfigs[i] && 
                       "uploading" in filesWithConfigs[i] && 
                       "url" in filesWithConfigs[i] &&
                       "pageCount" in filesWithConfigs[i] &&
                       "fileConfigs" in filesWithConfigs[i] 
                    ){}
                    else
                    {
                        
                        return res.status(400).json({
                            success : false,
                            message : "Invalid Files.Please Re-upload docs.No field"
                        })
                    }

                }
                else{
                    return res.status(400).json({
                        success : false,
                        message : "Invalid Files. Please Re-upload docs.No lenght."
                    })
                }

            }
            else
            {

                return res.status(400).json({
                success : false,
                message : "Invalid Files. Please Re-upload docs."
                })
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
            otp:OTP 
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
