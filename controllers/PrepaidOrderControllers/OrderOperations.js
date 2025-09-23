const { request } = require("express");
const usersCollection = require("../../models/Users");
const OngoingOrders = require("../../models/OrderTypes/OngoingOrders");
const {sendNotification} = require("../Notification");
const usedOrderOTP = require("../../models/TemporaryStorage/usedOTP.js");
const mongoose = require("mongoose");


const { Mutex } = require('async-mutex');

const mutex = new Mutex();
const mutexB = new Mutex();


exports.completeOrder = async(req,res)=>
{
    //Only access by vendor 
    const {orderId} = req.body;

    const{id} = req.tokenPayload;

    if(!orderId)
    {
        return res.status(400).json({
            success : false,
            message : "Please specify the orderId."
        })
    }

    const release = await mutex.acquire();
    try
    {

        const ongoingOrder = await OngoingOrders.findOne({ orderId , vendor:id})
        .populate({
            path: "user",         
        });


        if(!ongoingOrder)
        {
            return res.status(400).json({
                success : false,
                message : "Such order doesn't exists."
            })
        }

        if(ongoingOrder.orderStatus === "completed")
        {
            return res.status(200).json({
                success : true,
                message : "This order is already completed."
            })
        }

        if(ongoingOrder.orderStatus !== "waiting")
        {
            return res.status(500).json({
                success : true,
                message : "This order is not in the waiting state."
            })
        }

        ongoingOrder.timeOfCompletion = new Date();
        ongoingOrder.orderStatus = "completed";

        ongoingOrder.save();

        let sessions = ongoingOrder.user.sessions;
        let n = sessions.length;
        let otp = ongoingOrder.otp;

        for(let i=0 ; i<n ; i++)
        {
            let token = sessions[i].fcmToken;
            if(token)
            {
                await sendNotification(token , `Order OTP : ${otp}` , "Your order is completed. Please come for pickup.")
            }
        }  
        
        return res.status(200).json({
            success : true,
            message : "Order status updated successfully."
        })

    }catch(e)
    {
        console.log("Error occured while updating the status of the ongoing order to completed order : " , e);
        return res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }
    finally
    {
        release(); // Unlock the mutex
    }

}

exports.processOrCancelOrder = async(req , res)=>
{
    const id = req.tokenPayload;
    const role = req.role;

    if(!id)
    {
        return res.status(400).json({
            success : false,
            message : "Id is required."
        })
    }

    if(role !== "vendor" || role !== "customer" )
    {
        return res.status(403).json({
            success : false,
            message : "You are not authorized to change the status of this order."
        })
    }

    const {orderId} = req.body;

    if(!orderId)
    {
        return res.status(400).json({
            success : false,
            message : "Please specify the orderId."
        })
    }   

    if(role === "vendor")
    {
        try
        {
            const ongoingOrder = await OngoingOrders.findOne({ orderId  , vendor : id});
            
            if(!ongoingOrder)
            {
                return res.status(400).json({
                    success : false,
                    message : "Such order doesn't exists."
                }) 
            }   

            if(ongoingOrder.orderStatus === "cancelled" || ongoingOrder.orderStatus === "completed")
            {
                return res.status(400).json({
                    success : false,
                    message : "Order status can be changed to processing only from waiting state."
                })
            }

            ongoingOrder.orderStatus = "processing";
            ongoingOrder.timeOfProcessing = new Date();
            ongoingOrder.save();

            return res.status(200).json({
                success : true,
                message : "Order status updated successfully."
            })
        }catch(e)
        {
            console.log("Error occured while updating the status of the ongoing order to processing order : " , e);
            return res.status(500).json({
                success : false,
                message : "Internal Server Error"
            })
        }
    }

    if(role === "customer")
    {
        try
        {
            const ongoingOrder = await OngoingOrders.findOne({ orderId  , user : id});
            
            if(!ongoingOrder)
            {
                return res.status(400).json({
                    success : false,
                    message : "Such order doesn't exists."
                }) 
            }  

            if(ongoingOrder.orderStatus === "completed" || ongoingOrder.orderStatus === "cancelled" )
            {
                return res.status(400).json({
                    success : false,
                    message : "Order status can be changed to cancelled only from waiting state."
                })
            }

            if(ongoingOrder.orderStatus === "processing")
            {
                return res.status(400).json({
                    success : false,
                    message : "Order is being processed by vendor. You can't cancel it now."
                })
            }
            
            ongoingOrder.orderStatus = "cancelled";
            ongoingOrder.cancelledBy = "customer";
            ongoingOrder.refunded = false;
            ongoingOrder.timeOfProcessing = new Date();
            ongoingOrder.save();

            return res.status(200).json({
                success : true,
                message : "Order cancelled successfully."
            })


        }catch(e)
        {
            console.log("Error occured while updating the status of the ongoing order to cancelled order : " , e);
            return res.status(500).json({
                success : false,
                message : "Internal Server Error"
            })
        }
    }
    

}

exports.cancelOrderByVendor = async(req , res)=>
{
    const id = req.tokenPayload;
    const role = req.role;

    if(!id)
    {
        return res.status(400).json({
            success : false,
            message : "Id is required."
        })
    }

    if(role !== "vendor")
    {
        return res.status(403).json({
            success : false,
            message : "You are not authorized to change the status of this order."
        })
    }

    const {orderId} = req.body;

    if(!orderId)
    {
        return res.status(400).json({
            success : false,
            message : "Please specify the orderId."
        })
    }

    try
    {
        const ongoingOrder = await OngoingOrders.findOne({ orderId  , vendor : id});

        if(!ongoingOrder)
        {
            return res.status(400).json({
                success : false,
                message : "Such order doesn't exists."
            }) 
        }

        if(ongoingOrder.orderStatus === "completed" || ongoingOrder.orderStatus === "cancelled")
        {
            return res.status(400).json({
                success : false,
                message : "Order status can be changed to cancelled only from waiting state."
            })
        }

        if(ongoingOrder.orderStatus === "processing")
        {
            return res.status(400).json({
                success : false,
                message : "Order is being processed. You can't cancel it now."
            })
        }

        ongoingOrder.orderStatus = "cancelled";
        ongoingOrder.cancelledBy = "vendor";
        ongoingOrder.refunded = true;
        ongoingOrder.timeOfProcessing = new Date();
        ongoingOrder.save();        

        return res.status(200).json({
            success : true,
            message : "Order cancelled successfully."
        })

    }catch(e)
    {
        console.log("Error occured while updating the status of the ongoing order to cancelled order : " , e);

        return res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }       

}

exports.refundOrder = async(req , res)=>{

    const id = req.tokenPayload;
    const role = req.role;

    const referenceNumber = req.body.referenceNumber;



    if(!id)
    {
        return res.status(400).json({
            success : false,
            message : "Id is required."
        })
    }
    if(role !== "vendor")
    {
        return res.status(403).json({
            success : false,
            message : "You are not authorized to change the status of this order to refunded."
        })
    }

    const {orderId} = req.body;

    if(!orderId)
    {
        return res.status(400).json({
            success : false,
            message : "Please specify the orderId."
        })
    }

    if(!referenceNumber)
    {
        return res.status(400).json({
            success : false,
            message : "Please specify the bank reference number."
        })
    }

    try
    {
        const ongoingOrder = await OngoingOrders.findOne({ orderId  , vendor : id})
                                                .populate({
                                                    path : "user"
                                                    });

        if(!ongoingOrder)
        {
            return res.status(400).json({
                success : false,
                message : "Such order doesn't exists."
            }) 
        }

        if(ongoingOrder.orderStatus !== "cancelled")
        {
            return res.status(400).json({
                success : false,
                message : "Only cancelled orders can be refunded."
            }) 
        }
        
        if(ongoingOrder.refunded)
        {
            return res.status(400).json({
                success : false,
                message : "This order is already refunded."
            }) 
        }

        ongoingOrder.refunded = true;
        ongoingOrder.refundBankReferenceNumber = referenceNumber;
        ongoingOrder.save();

        let n = ongoingOrder.user.length;
        for(let i=0 ; i<n ; i++)
        {
            let token = ongoingOrder.user[i].fcmToken;
            if(token)
            {
                await sendNotification(token , "Your order price has been refunded.Please check your dashboard." , "Refund Processed")
            }
        }  
        
        return res.status(200).json({
            success : true,
            message : "Order refunded successfully."
        })  

    }catch(e)
    {
        console.log("Error occured while updating the status of the ongoing order to refunded order : " , e);
        return res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }

}

exports.ongoingOrderCount_TimeCalculation = async(req , res)=>
{
    // customer not vendor 
    // then it is vendor specific 

    const id = req.tokenPayload.id;
    const role = req.tokenPayload.role;
    const vendorId = "67c56ba5d680782c6d00645f"

    if(!id)
    {
        return res.status(400).json({
            success : false,
            message : "Id is required."
        })
    }

    if(role !== "customer")
    {
        return res.status(403).json({
            success : false,
            message : "You are not authorized to access this data."
        })
    }

    try
    {
        const ongoingOrders = await OngoingOrders.find({
            vendor : vendorId , 
            orderStatus: "waiting"
        });

        const count = ongoingOrders.length;

        let totalTime = 0;
        let pageCount = 0;
        
        const currentTime = new Date();
        
        ongoingOrders.forEach(order => {

            let n = order.documents.length;
            for(let i=0 ; i<n ; i++)
            {
                
                pageCount += (order.documents[i].pageCount * order.documents[i].fileConfigs["copies"]);
            }
        })

        

        let len = ongoingOrders.length;
        totalTime = pageCount * 1.25; //in sec
        totalTime = Math.ceil(totalTime / 60); //in mins
        totalTime = Math.ceil(totalTime + 0.80*len); 

        return res.status(200).json({
            success : true,
            data : {
                count : count,
                estimatedTime : totalTime
            }
        })

    }catch(e)
    {
        console.log("Error occured while fetching the ongoing order count and estimated time : " , e);
        return res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }
}


exports.createOrderHistory = async(req , res)=>
{
    // only customer can access this 
    // 
    const id = req.tokenPayload.id;
    const { role } = req.tokenPayload;

    if(!id)
    {
        return res.status(400).json({
            success : false,
            message : "Id is required."
        })
    }

    if(role === "vendor")
    {
        return res.status(403).json({
            success : false,
            message : "You are not authorized to recieve the order."
        })
    }

    const {orderId} = req.body;

    if(!orderId)
    {
        return res.status(400).json({
            success : false,
            message : "Please specify the orderId."
        })
    }

    const releaseB = await mutexB.acquire();
    const session = await mongoose.startSession();
    session.startTransaction();
    try
    {
        const ongoingOrder = await OngoingOrders.findOne({ orderId, user: id }).session(session);

        if(!ongoingOrder)
        {
             await session.abortTransaction();
            return res.status(400).json({
                success : false,
                message : "Such order doesn't exists."
            }) 
        }

        if(ongoingOrder.orderStatus === "waiting")
        {
             await session.abortTransaction();
            return res.status(400).json({
                success : false,
                message : "You can only receive order once it is completed."
            })
        }

        if(ongoingOrder.orderStatus === "received")
        {
            await session.abortTransaction();
            return res.status(400).json({
                success : false,
                message : "You have already received this order."
            })
        }

        
        ongoingOrder.orderStatus = "received";
        ongoingOrder.recievedBy = id;
        ongoingOrder.timeOfRecieving = new Date(); 
        await ongoingOrder.save({ session });      

        const removedOTP = await usedOrderOTP.updateOne(
            { _id: "68d26ee389879fe2de1a1ab9" },
            { $pull: { orderOtps: ongoingOrder.otp } }
            ,{session }
        );

        await session.commitTransaction();

        return res.status(200).json({
            success : true,
            message : "Thank you for using easer."
        })

    }catch(e)
    {
        await session.abortTransaction();

        console.log("Error occured while updating the status of the ongoing order to cancelled order : " , e);

        return res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }  
    finally
    {
        session.endSession();
        releaseB();
    }    
}


            




