const onGoingOrders = require('../../models/OrderTypes/OngoingOrders.js');
const usersCollection = require('../../models/Users.js');
// const documents = require("../../models/documents.js");
// const cancelledOrders = require("../../models/cancelledOrders.jsx");
// const unreceivedOrders  = require("../../models/unReceivedOrders.js");
// const vendorAdditionalDetails = require("../../models/vendorInfo.js");
// const fineSchema = require("../../models/FineSchema.jsx");

exports.getAllOrdersOfVendor = async (req, res) => {
    try {
        //extract the data from the user
        const { vendorID } = req.body;
        const { id, role } = req.tokenPayload;

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

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Id is missing.',
            });
        }

        // validating the data
        let isVendorValid = '';
        if (role === 'customer') {
            if (!vendorID) {
                return res.status(400).json({
                    success: false,
                    message: 'Please Specify the vendorID',
                });
            }
            isVendorValid = await usersCollection.findOne({
                role: 'vendor',
                userId: vendorID,
            });

            if (!isVendorValid) {
                return res.status(400).json({
                    success: false,
                    message: "Such Vendor doesn't exists",
                });
            }
        }

        let userData = await usersCollection.findOne({ _id: id });

        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such ${role} doesn't exists`,
            });
        }

        let response = '';
        let processedResponse = '';
        if (role === 'customer') {
            response = await onGoingOrders
                .find({ vendor: isVendorValid._id })
                .select(
                    '-_id paymentMode orderStatus orderId user documents waitingTime userOrderCancellation vendorOrderCancellation notifyCustomerIndicator processOrderIndicator timeOfTurn'
                )
                .populate([
                    {
                        path: 'user',
                        select: '_id firstName lastName',
                    },
                ]);
            console.log(' order : ', response);

            // processedResponse = response.map((order)=>
            // {
            //     const orderObject = order.toObject();
            //     const isUserMatch = orderObject.user && orderObject.user._id.toString() === id;

            //     return {
            //         ...orderObject,
            //         documents : orderObject.documents.documents.length,
            //         user : (isUserMatch ? {firstName : orderObject.user.firstName , lastName : orderObject.user.lastName} : {firstName : orderObject.user.firstName.charAt(0) , lastName : orderObject.user.lastName.charAt(0)} ),
            //         yourOrder:(isUserMatch ? true : false),
            //         timeOfTurn : (isUserMatch ? orderObject.timeOfTurn : undefined)
            //     }

            // })
        }

        if (role === 'vendor') {
            return res.status(400).json({
                success: false,
                message: "Vendor can't access this page",
            });
        }

        //return
        return res.status(200).json({
            success: true,
            message: 'Data is fetched successfully',
            data: processedResponse,
        });
    } catch (e) {
        console.log(
            'Error occured while fetching all the orders of a particular vendor : ',
            e
        );
        return res.status(500).json({
            success: false,
            message: 'ERROR OCCURED',
            error: e.message,
        });
    }
};

exports.getAllCancelledOrders = async (req, res) => {
    try {
        //Extarct id from the req body
        const { id, role } = req.tokenPayload;

        //Then check whether the id is empty or not
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Please Specify your ID',
            });
        }

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Please Specify your Role',
            });
        }

        if (!['user', 'vendor'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Such Role doesn't exists",
            });
        }

        let isIdValid = '';
        if (role === 'user') {
            isIdValid = await users
                .findOne({ _id: id })
                .select('-_id cancelledOrders ')
                .populate({
                    path: 'cancelledOrders',
                    select: '-_id -user',
                    populate: [
                        {
                            path: 'vendor',
                            select: '-_id vendorAdditionalDetails',
                            populate: [
                                {
                                    path: 'vendorAdditionalDetails',
                                    select: '-_id shopName shopLandMark',
                                },
                            ],
                        },
                    ],
                })
                .sort({ 'times.timeOfCancellation': -1 });
        }

        if (role === 'vendor') {
            isIdValid = await users
                .findOne({ _id: id })
                .select('-_id cancelledOrders')
                .populate({
                    path: 'cancelledOrders',
                    select: '-_id -vendor',
                    populate: [
                        {
                            path: 'user',
                            select: '-_id firstName lastName email mobileNumber',
                        },
                    ],
                })
                .sort({ 'times.timeOfCancellation': -1 });
        }

        if (!isIdValid) {
            return res.status(400).json({
                success: false,
                message: "Such User doesn't exists",
            });
        }

        //send in the res body
        return res.status(200).json({
            success: true,
            message: 'cancelled Orders are successfully fetched',
            response: isIdValid,
            role: role,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching cancelled orders of sepcific user : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error,
        });
    }
};

exports.getAllSpecificOnGoingOrders = async (req, res) => {
    try {
        //Extract the UserId from the req body
        const { id, role } = req.tokenPayload;

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

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Id is missing.',
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

        //Then findAll from the onGoingOrders and sort in the descedning of the time
        let response = '';
        if (role === 'customer') {
            response = await onGoingOrders
                .find({ user: id })
                .select('-_id -user')
                .populate({
                    path: 'vendor',
                    select: '-_id vendorAdditionalDetails userId',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark',
                    },
                })
                .populate({
                    path: 'documents',
                    select: '-_id',
                });
        }

        if (role === 'vendor') {
            response = await onGoingOrders
                .find({ vendor: id })
                .select('-_id -vendor')
                .populate({
                    path: 'user',
                    select: '-_id firstName lastName email mobileNumber userId',
                })
                .populate({
                    path: 'documents',
                    select: '-_id',
                });
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
        //Extract Id , role from the body
        const { id, role } = req.tokenPayload;

        //Check whether the Id is empty or not
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Please Specify your Id',
            });
        }

        //Check whether the role is empty or not
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Please Specify your role',
            });
        }

        //check whether the role is valid or not
        if (!['user', 'admin', 'vendor'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role entered',
            });
        }

        //Check whether the Id is valid or not
        let response = await users.findOne({ _id: id });

        if (!response) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id entered',
            });
        }

        // if everyhting is fine i will fetch the detail from the user card and populate something
        // if(role === user) populate(unreceide orders) , select unreceive orders then
        //from un recieved orders populate documents , vendor (select shopName , shopLandMark) populate(vendorAdditionaldetails select fineSchema popluate kardo)
        if (role === 'user') {
            response = await users
                .findOne({ _id: id })
                .select('-_id unreceivedOrders')
                .populate({
                    path: 'unreceivedOrders',
                    select: '-_id -user',
                    populate: [
                        {
                            path: 'documents',
                            select: '-_id -documents.public_id',
                        },

                        {
                            path: 'vendor',
                            select: '-_id vendorAdditionalDetails',
                            populate: [
                                {
                                    path: 'vendorAdditionalDetails',
                                    select: '-_id shopName shopLandMark fineSchema',
                                    populate: [
                                        {
                                            path: 'fineSchema',
                                            select: '-_id',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
        }

        //if(role === vendor) populate(unreceived Orders) select unreceived Orders, populate user and select firstName ,lastName and email , populate Documents , populate vendor opulate(vendorAdditionaldetails select fineSchema popluate kardo
        if (role === 'vendor') {
            response = await users
                .findOne({ _id: id })
                .select('-_id unreceivedOrders')
                .populate({
                    path: 'unreceivedOrders',
                    select: '-_id',
                    populate: [
                        {
                            path: 'documents',
                            select: '-_id',
                        },
                        {
                            path: 'user',
                            select: '-_id firstName lastName email mobileNumber userId',
                        },
                        {
                            path: 'vendor',
                            select: '-_id vendorAdditionalDetails',
                            populate: [
                                {
                                    path: 'vendorAdditionalDetails',
                                    select: '-_id fineSchema',
                                    populate: [
                                        {
                                            path: 'fineSchema',
                                            select: '-_id',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
        }

        //retunr the response
        return res.status(200).json({
            success: true,
            message: 'unrecieved Orders fetched successfully',
            data: response,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching unreceived orders of sepcific user : ',
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
        if (!['user', 'vendor'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role entered',
            });
        }

        //Check whether the Id is valid or not
        let isUseridValid = await users.findOne({ _id: id });

        if (!isUseridValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Id entered',
            });
        }

        let response = '';
        if (role === 'vendor') {
            response = await users
                .findById(id)
                .populate({
                    path: 'orderHistory',
                    populate: [
                        {
                            path: 'user',
                            select: '-_id firstName lastName email mobileNumber',
                        },
                    ],
                    select: '-_id -vendor',
                })
                .select('-_id orderHistory');
        }

        if (role === 'user') {
            response = await users
                .findById(id)
                .populate({
                    path: 'orderHistory',
                    populate: [
                        {
                            path: 'vendor',
                            select: '-_id vendorAdditionalDetails',
                            populate: {
                                path: 'vendorAdditionalDetails',
                                select: '-_id shopName shopLandMark',
                            },
                        },
                    ],
                    select: '-_id -user',
                })
                .select('-_id orderHistory');
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
