const mongoose = require('mongoose');
const mailSender = require('../../utils/mailSender.js');

const OTP = new mongoose.Schema({
    Otp: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
    },

    expiredAt: {
        type: Date,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 5 * 60, // 5 minutes in seconds
    },
});

module.exports = mongoose.model('OTP', OTP);
