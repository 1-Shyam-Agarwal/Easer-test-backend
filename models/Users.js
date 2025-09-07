const mongoose = require('mongoose');
const registeredColleges = require('../models/RegisteredColleges.js');
const unreceivedOrders = require('./OrderTypes/UnreceivedOrders.js');
const vendor = require('./VendorExtraDetails.js');
const mails = require('../models/Mails.js');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },

    lastName: {
        type: String,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    mobileNumber: {
        type: String,
        required: true,
    },

    password: {
        type: String,
    },

    collegeCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registeredColleges',
        required: true,
    },

    profileImage: {
        type: String,
        required: true,
    },

    cancelledOrders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'cancelledOrders',
            required: true,
        },
    ],

    unreceivedOrders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'unreceivedOrders',
            required: true,
        },
    ],

    trashedOrders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'trashedOrders',
            required: true,
        },
    ],

    orderHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'orderHistory',
            required: true,
        },
    ],

    token: {
        type: String,
        default: null,
    },

    resetPasswordExpires: {
        type: Date,
        default: null,
    },

    role: {
        required: true,
        type: String,
        enum: ['admin', 'customer', 'vendor'],
    },

    vendorAdditionalDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor',
    },

    userId: {
        type: String,
        required: true,
    },

    mails: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'mails',
        },
    ],

    pointsEarned: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model('usersCollection', userSchema);
