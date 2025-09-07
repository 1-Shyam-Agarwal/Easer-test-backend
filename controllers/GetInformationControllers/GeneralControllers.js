//RegisteredColleges Model
const registeredColleges = require('../../models/RegisteredColleges.js');
const onGoingOrders = require('../../models/OrderTypes/OngoingOrders.js');
const usersCollection = require('../../models/Users.js');

exports.getAllRegisteredCollegesController = async (req, res) => {
    try {
        const response = await registeredColleges
            .find({})
            .select('-_id collegeCode collegeName');

        return res.status(200).json({
            success: true,
            message: 'Data is successfully fetched',
            response,
        });
    } catch (e) {
        console.log('Error occured while fetching the college list : ', e);
        res.status(500).json({
            success: false,
            message: e.message,
        });
    }
};

exports.getUserInformation = async (req, res) => {
    try {
        //Extract the data from the req.
        const { id, role } = req.tokenPayload;

        //Then validate the payload

        if (!id || !role) {
            return res.status(400).json({
                success: false,
                message: 'Id or Role is missing.',
            });
        }

        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Role',
            });
        }

        let userData = await usersCollection.findOne({ _id: id, role });

        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such user doesn't exists.`,
            });
        }

        if (role === 'customer' || role === 'admin') {
            userData = await usersCollection
                .findOne({ _id: id, role: role })
                .select(
                    '-_id firstName lastName email role collegeCode mobileNumber profileImage'
                )
                .populate({
                    path: 'collegeCode',
                    select: '-_id collegeName',
                });
        }

        if (role === 'vendor') {
            userData = await usersCollection
                .findOne({ _id: id, role: 'vendor' })
                .select(
                    '-_id firstName lastName email mobileNumber role collegeCode vendorAdditionalDetails profileImage'
                )
                .populate({
                    path: 'collegeCode',
                    select: '-_id collegeName',
                })
                .populate({
                    path: 'vendorAdditionalDetails',
                    select: '-_id shopName shopLandMark isShopOpen',
                    // populate : [
                    //     {
                    //         path: "fineSchema",
                    //         select: "-_id"
                    //     },
                    //     {
                    //         path: "priceSchema",
                    //         select: "-_id -vendor"
                    //     }
                    // ]
                });
        }

        //return the data
        return res.status(200).json({
            success: true,
            message: 'data successfully fetched',
            data: userData,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching the data for the user profile : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }
};

exports.getUserRole = async (req, res) => {
    try {
        //Extract the data from the req.
        const { id, role } = req.tokenPayload;

        //Then validate the payload

        if (!id || !role) {
            return res.status(400).json({
                success: false,
                message: 'Id or Role is missing.',
            });
        }

        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Role',
            });
        }

        let userData = await usersCollection.findOne({ _id: id, role });

        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such ${role} doesn't exists`,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Role successfully fetched',
            role: userData.role,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching the role for the user profile : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }
};

exports.getUserId = async (req, res) => {
    try {
        //Extract the data from the req.
        const { id, role } = req.tokenPayload;

        //Then validate the payload

        if (!id || !role) {
            return res.status(400).json({
                success: false,
                message: 'Id or Role is missing.',
            });
        }

        if (!['user', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Role',
            });
        }

        let userData = '';

        userData = await usersCollection
            .findOne({ _id: id, role: role })
            .select('userId');

        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such ${role} doesn't exists`,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Userid fetched successfully.',
            userId: userData.userId,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching the Userid for the user profile : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }
};
