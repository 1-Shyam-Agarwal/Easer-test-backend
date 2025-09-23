const mongoose = require('mongoose');
const user = require('../Users.js');

const onGoingOrdersSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usersCollection',
    },

    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usersCollection',
    },

    documents: [
        {
            type: Object,
            required: true,
        },
    ],

    paymentMode: {
        type: String,
        required: true,
        default: 'online',
    },

    paymentStatus: {
        type: String,
        required: true,
        default: 'paid',
    },

    orderStatus: {
        type: String,
        enum: ['waiting', 'completed','received'],
        default: 'waiting',
        required: true,
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

    paymentTime: {
        type: Date,
        required: true,
    },

    timeOfCompletion : {
        type : Date
    },

    timeOfProcessing : {
        type : Date
    },

    cancelledBy : {
        type : String,
        enum : ['vendor' , 'customer']
    },

    refunded :{
        type : Boolean,
        enum : [true , false , null],
        default : null
    },

    bankReferenceNumber: {
        type: String,
    },

    refundBankReferenceNumber :{
        type : String
    },

    paymentId: {
        type: String,
    },

    otp: {
        type: String,
        required: true,
        unique: true,
    },

    
    recievedBy:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'usersCollection'
    },

    timeOfRecieving : {
        type : Date
    },

    remainingTime:{
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('onGoingOrders', onGoingOrdersSchema);
