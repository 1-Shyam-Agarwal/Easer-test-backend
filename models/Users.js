const mongoose = require('mongoose');
const registeredColleges = require('../models/RegisteredColleges.js');
const unreceivedOrders = require('./OrderTypes/UnreceivedOrders.js');
const vendor = require('./VendorExtraDetails.js');
const mails = require('../models/Mails.js');

const sessionSchema = new mongoose.Schema({
  token: {
    type : String,
    required : true
  }, 

  device: {
    type : String,
    required : true
  },        

  loginAt: { 
    type: Date, 
    required : true,
    default: Date.now 
  },

  fcmToken: String       
});

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
        },
    ],

    unreceivedOrders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'unreceivedOrders',
        },
    ],

    trashedOrders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'trashedOrders',
        },
    ],

    orderHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'orderHistory',
        },
    ],

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

    sessions: [sessionSchema]   // multiple sessions
});

module.exports = mongoose.model('usersCollection', userSchema);
