const mongoose = require('mongoose');
const user = require('../Users.js');

const onGoingOrdersSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usersCollection',
        required:true
    },

    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usersCollection',
        required:true
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
        enum : ["paid" , "unpaid"],
        required: true,
        default: 'unpaid',
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
        required : true
    },

    orderId: {
        type: String,
        required: true,
    },

    paymentTime: {
        type: Date,

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
    }
});

module.exports = mongoose.model('onGoingOrders', onGoingOrdersSchema);
