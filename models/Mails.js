const mongoose = require('mongoose');

const mailDocumentSchema = mongoose.Schema({
    fileName: {
        type: String,
        required: true,
    },

    fileRef: {
        type: String,
        required: true,
    },

    fileType: {
        type: String,
        required: true,
    },

    fileSize: {
        type: String,
        required: true,
    },

    fileUrl: {
        type: String,
        required: true,
    },
});

const mailSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usersCollection',
        required: true,
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usersCollection',
        required: true,
    },

    timeStamp: {
        type: Date,
        default: Date.now,
        required: true,
    },

    documents: {
        type: [mailDocumentSchema],
        required: true,
    },

    mail_id: {
        type: String,
        required: true,
        unique: true,
    },
});

module.exports = mongoose.model('Mails', mailSchema);
