const usersCollection = require('../../models/Users.js');

exports.changeShopStatus = async (req, res) => {
    try {
        const {id , role} = req.tokenPayload;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the vendorid',
            });
        }

        if(role !== "vendor"){
            return res.status(400).json({
                success: false,
                message: 'User is not a vendor',
            });
        }

        const vendor = await usersCollection.findOne({ _id: id, role: "vendor" }).populate("vendorAdditionalDetails");

        if (!vendor || !vendor.vendorAdditionalDetails) {
            return res.status(400).json({
                success: false,
                message: 'Vendor not found.',
            });
        }

        vendor.vendorAdditionalDetails.isShopOpen = !vendor.vendorAdditionalDetails.isShopOpen;
        await vendor.vendorAdditionalDetails.save();


        //  Successfully toggled
        return res.status(200).json({
        success: true,
        message: "Shop status toggled successfully.",
        });
       

    } catch (error) {
        console.log('Error occured while setting the shop status : ', error);
        return res.status(400).json({
            success: false,
            message: 'Internal Server Problem',
            error: error.message,
        });
    }
};