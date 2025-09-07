const usersCollection = require('../../models/Users.js');

exports.getShopStatus = async (req, res) => {
    try {
        const { vendorId } = req.body;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the vendorid',
            });
        }

        const isVendorValid = await usersCollection
            .findOne({ userId: vendorId })
            .select('-_id vendorAdditionalDetails')
            .populate({
                path: 'vendorAdditionalDetails',
                select: '-_id , isShopOpen',
            });

        if (!isVendorValid) {
            return res.status(400).json({
                success: false,
                message: 'Vendor not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Shop status fetched successfully',
            data: isVendorValid,
        });
    } catch (error) {
        console.log('Error occured while fetching the shop status : ', error);
        return res.status(400).json({
            success: false,
            message: 'Internal Server Problem',
            error: error.message,
        });
    }
};

exports.getShopInfo = async (req, res) => {
    try {
        const shopId = req.body.shopId;

        if (!shopId) {
            return res.status(400).json({
                success: false,
                message: 'Shop id is required',
            });
        }

        const response = await usersCollection
            .findOne({ userId: shopId })
            .select('-_id vendorAdditionalDetails collegeCode')
            .populate([
                {
                    path: 'vendorAdditionalDetails',
                    select: '-_id shopName shopLandMark',
                },
                {
                    path: 'collegeCode',
                    select: '-_id collegeName',
                },
            ]);

        if (!response) {
            return res.status(400).json({
                success: false,
                message: 'This shop is not listed in our records.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Shop info is fetched successfully.',
            response: response,
        });
    } catch (error) {
        console.log(
            'Error occured while fetching the shop information at place order page without login : '
        );
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Internal server problem',
            error: error.message,
        });
    }
};
