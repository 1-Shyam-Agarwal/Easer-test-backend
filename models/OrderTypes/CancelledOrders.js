const mongoose = require('mongoose');

const CancelledDocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },

    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },

    orderID: {
        type: String,
        required: true,
    },

    orderFiles: [
        {
            type: Object,
            required: true,
        },
    ],

    orderPrice: {
        type: String,
        required: true,
    },

    paymentMode: {
        type: String,
        required: true,
    },

    paymentStatus: {
        type: String,
        required: true,
    },

    refundStatus: {
        type: Boolean,
        required: true,
        default: false,
    },

    times: {
        type: Object,
        required: true,
    },

    reason: {
        type: String,
        required: true,
        default: 'NA',
    },

    cancelledBy: {
        type: String,
        required: true,
        enum: ['user', 'vendor'],
    },

    refundTime: {
        type: Date,
    },

    bankReferenceNumber: {
        type: String,
    },

    paymentId: {
        type: String,
    },
});

module.exports = mongoose.model('cancelledOrders', CancelledDocumentSchema);
