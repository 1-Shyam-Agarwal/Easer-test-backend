const mongoose = require('mongoose');

const unreceivedDocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },

    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },

    documents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'documents',
        },
    ],

    paymentMode: {
        type: String,
        enum: ['online', 'offline'],
        required: true,
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        required: true,
    },

    orderStatus: {
        type: String,
        enum: ['completed'],
        required: true,
    },

    shopName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendorInfo',
    },

    price: {
        type: Number,
        required: true,
    },

    orderedAt: {
        type: Date,
        default: Date.now,
    },

    orderId: {
        type: String,
        required: true,
    },

    timeOfTurn: {
        type: Date,
    },

    timeOfPrinting: {
        type: Date,
        required: true,
    },

    timeOfCompletion: {
        type: Date,
        required: true,
    },

    bankReferenceNumber: {
        type: String,
    },

    paymentId: {
        type: String,
    },
});

module.exports = mongoose.model('unreceivedOrders', unreceivedDocumentSchema);
