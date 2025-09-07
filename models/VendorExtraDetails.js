const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true,
    },

    shopLandMark: {
        type: String,
        required: true,
    },

    priceSchema: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'priceSchema',
        required: true,
    },

    waitingTime: {
        type: Number,
        required: true,
    },

    paymentGatewayInfo: {
        type: Object,
        required: true,
    },

    isShopOpen: {
        type: Boolean,
        required: true,
        default: false,
    },
});

module.exports = mongoose.model('vendor', vendorSchema);
