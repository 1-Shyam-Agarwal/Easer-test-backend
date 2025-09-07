const usersCollection = require('../../models/Users.js');

//Fetch vendors of a particular college with only very few details : vendorId , shopName , shopLandMark
exports.getFilteredVendorsWithMinimumDetailsController = async (req, res) => {
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

        const response = await usersCollection
            .find({ role: 'vendor', collegeCode: userData?.collegeCode })
            .select('-_id userId vendorAdditionalDetails')
            .populate({
                path: 'vendorAdditionalDetails',
                select: '-_id shopName shopLandMark',
            });

        return res.status(200).json({
            success: true,
            message: 'Data is fetched successfully',
            filteredVendors: response,
        });
    } catch (e) {
        console.log(
            'Error occured while fetching the filtered vendors with minimum details : ',
            e
        );
        res.status(500).json({
            success: false,
            message: e.message,
        });
    }
};
