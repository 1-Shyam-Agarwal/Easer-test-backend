const onGoingOrders = require('../../models/OrderTypes/OngoingOrders.js');
const usersCollection = require('../../models/Users.js');

exports.getAllSpecificOnGoingOrders = async (req, res) => {
    try {
        //Extract the UserId from the req body
        const { id, role } = req.tokenPayload;

        if(!id)
        {
            return res.status(400).json({
                success: false,
                message: 'Id is missing.',
            })
        }

        //check whether the usrId is empty or not
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is missing.',
            });
        }

        if (!['customer', 'vendor'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Role',
            });
        }

        // check whether is user it exists or not
        const isUseridValid = await usersCollection.findOne({ _id: id });

        if (!isUseridValid) {
            return res.status(400).json({
                success: false,
                message: `Such ${role} doesn't exists.`,
            });
        }

        //Then findAll from the onGoingOrders and sort in the ascedning order of the time
        let response = '';
        if (role === 'customer') {
            response = await onGoingOrders.find({
                user: id,
                orderStatus: { $in: ["waiting", "completed"] }
                })
                .select('-_id')
                .populate({
                    path: 'vendor',
                    select: '-_id vendorAdditionalDetails userId',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark',
                    },
                })
                .populate({
                    path: 'user',
                    select: '-_id firstName lastName email mobileNumber',
                })
                .sort({ orderedAt: 1 });
        }

        if (role === 'vendor') {
            response = await onGoingOrders
                .find({ vendor: id ,orderStatus:'waiting'})
                .select('-_id')
                .populate({
                    path: 'user',
                    select: '-_id firstName lastName email mobileNumber userId',
                })
                .populate({
                    path: 'vendor',
                    select: '-_id vendorAdditionalDetails userId',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark',
                    },
                })
                .sort({ otp : 1 });
        }

        //then return
        return res.status(200).json({
            success: true,
            message: 'Successfully fetched the onGoingOrders',
            data: response,
        });
    } catch (error) {

        console.log(
            'Error occured while fetching ongoing orders of sepcific user : ',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error,
        });
    }
};

exports.getAllSpecificUnreceivedOrders = async (req, res) => {
    try {
        //Extract the UserId from the req body
        const { id, role } = req.tokenPayload;

        if(!id)
        {
            return res.status(400).json({
                success: false,
                message: 'Id is missing.',
            })
        }

        //check whether the usrId is empty or not
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is missing.',
            });
        }

        if (role!=='vendor') {
            return res.status(400).json({
                success: false,
                message: 'Invalid Role',
            });
        }

        // check whether is user it exists or not
        const isUseridValid = await usersCollection.findOne({ _id: id , role:'vendor'});

        if (!isUseridValid) {
            return res.status(400).json({
                success: false,
                message: `Such ${role} doesn't exists.`,
            });
        }

        //Then findAll from the onGoingOrders and sort in the ascedning order of the time

    let response = await onGoingOrders
        .find({ vendor: id ,orderStatus:'completed'})
        .select('-_id')
        .populate({
            path: 'user',
            select: '-_id firstName lastName email mobileNumber userId',
        })
        .populate({
            path: 'vendor',
            select: '-_id vendorAdditionalDetails userId',
            populate: {
                path: 'vendorAdditionalDetails',
                select: '-_id shopName shopLandMark',
            },
        })
        .sort({ orderedAt : 1 });

        //then return
        return res.status(200).json({
            success: true,
            message: 'Successfully fetched the onGoingOrders',
            data: response,
        });
    } catch (error) {

        console.log(
            'Error occured while fetching unreceived orders of sepcific vendor : ',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error,
        });
    }
};

exports.getAllSpecificOrderHistory = async (req, res) => {
    try {
        //Extract Id , role from the body
        const { id, role } = req.tokenPayload;

        console.log("id : " , id)

        //Check whether the Id is empty or not
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Please specify your id.',
            });
        }

        //Check whether the role is empty or not
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Please specify your role',
            });
        }

        //check whether the role is valid or not
        if (!['customer', 'vendor'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role entered',
            });
        }

        //Check whether the Id is valid or not
        let isUseridValid = await usersCollection.findOne({ _id: id });

        if (!isUseridValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id entered',
            });
        }

        let response = '';
        if (role === 'vendor') {
            response = await onGoingOrders
                .find({vendor : id , orderStatus:"received"})
                .select('-_id')
                .populate({
                    path: 'vendor',
                    select: '-_id vendorAdditionalDetails userId',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark',
                    },
                })
                .populate({
                    path: 'user',
                    select: '-_id firstName lastName email mobileNumber',
                })
                .sort({ orderedAt: -1 });
        }

        if (role === 'customer') {
            response = await onGoingOrders
                .find({user:id , orderStatus:"received"})
                .select('-_id')
                .populate({
                    path: 'vendor',
                    select: '-_id vendorAdditionalDetails userId',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark',
                    },
                })
                .populate({
                    path: 'user',
                    select: '-_id firstName lastName email mobileNumber',
                })
                .sort({ orderedAt: -1 });
        }

        //return data
        res.status(200).json({
            success: true,
            message: 'order history fetched successfully',
            data: response,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching order history of sepcific user : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error,
        });
    }
};

exports.getSpecificOnlineOrderDetails = async (req, res) => {
    const { onlineOrderId } = req.body;
    const userId = req.tokenPayload.id;
    const role = req.tokenPayload.role;

    if (!onlineOrderId) {
        return res.status(400).json({
            success: false,
            message: 'Online order id is required.',
        });
    }

    if (!role) {
        return res.status(400).json({
            success: false,
            message: 'role is required.',
        });
    }

    if (!['customer', 'vendor'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: "Such role deosn't exists.",
        });
    }

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'userId is required.',
        });
    }

    let isUserValid;
    try {
        isUserValid = await usersCollection.findOne({ _id: userId });
    } catch (error) {
        console.log(
            'Error occured in fetching user details during getting specific online order : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }

    if (!isUserValid) {
        return res.status(400).json({
            success: false,
            message: "User doesn't exists.",
        });
    }

    let orderDetails = '';
    try {
        orderDetails = await onGoingOrders
            .find({ orderId: onlineOrderId })
            .select('-_id ')
            .populate({
                path: 'vendor',
                select: '-_id vendorAdditionalDetails userId',
                populate: {
                    path: 'vendorAdditionalDetails',
                    select: '-_id shopName shopLandMark',
                },
            })
            .populate({
                path: 'user',
                select: '-_id firstName lastName email mobileNumber userId',
            })
            .populate({
                path: 'documents',
                select: '-_id',
            });
    } catch (error) {
        console.log(
            'Error occured in fetching order details during getting specific online order : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        });
    }

    if (!orderDetails) {
        return res.status(400).json({
            success: false,
            message: "Order doesn't exists.",
        });
    }

    if (orderDetails.user === userId || orderDetails.vendor === userId) {
        return res.status(400).json({
            success: false,
            message: 'Unauthorised Access.',
        });
    }

    //then return
    return res.status(200).json({
        success: true,
        message: 'Successfully fetched the onGoingOrders',
        data: orderDetails,
    });
};


exports.getOngoingOrdersCount = async(req,res)=>
{
    const{id , role} = req.tokenPayload;

    if(!id)
    {
        return res.status(400).json({
            success: false,
            message: 'Id is missing.',
        })
    }

    //check whether the usrId is empty or not
    if (!role) {
        return res.status(400).json({
            success: false,
            message: 'Role is missing.',
        });
    }

    if (role!=='vendor') {
        return res.status(400).json({
            success: false,
            message: 'Invalid Role',
        });
    }

    // check whether is user it exists or not
    const isUseridValid = await usersCollection.findOne({ _id: id , role:"vendor"});

    if (!isUseridValid) {
        return res.status(400).json({
            success: false,
            message: `Such user doesn't exists.`,
        });
    }

    try
    {
        const count = await onGoingOrders.countDocuments({ 
            vendor: id, 
            orderStatus: "waiting" 
        });

        return res.status(200).json({
            success: true,
            message: "ongoing order count fetched successfully.",
            count
        });
    }catch(e)
    {
        console.log("Error occured while counting the ongoing orders : " , e);
        return res.status(500).json({
            success: false,
            message: "Internal server problem.",
        });
    }
}
