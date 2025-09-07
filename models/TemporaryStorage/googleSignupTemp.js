const mongoose = require('mongoose');

const googleSignupTempSchema = new mongoose.Schema({
    firstName: {
        required: true,
        lowercase: true,
        type: String,
    },

    lastName: {
        type: String,
        lowercase: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    picture: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        required: true,
        type: Date,
        default: Date.now(),
        expires: 5 * 60, // 5 minutes in second
    },
});

module.exports = mongoose.model('googleSignupTemp', googleSignupTempSchema);
