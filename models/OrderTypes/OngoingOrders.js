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
        enum: ['printing', 'waiting', 'completed'],
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

    // userOrderCancellation:
    // {
    //     type:Boolean,
    //     default:false,
    //     required:true,
    // },

    // vendorOrderCancellation :{
    //     type :Boolean,
    //     default : false,
    //     required : true
    // },

    // timeOfTurn :{
    //     type : Date
    // },

    // timeOfPrinting : {
    //     type : Date
    // },

    // waitingTime:
    // {
    //     type:Number
    // },

    // notifyCustomerIndicator : {
    //     type : Boolean,
    //     required:true,
    //     default:false
    // },

    // processOrderIndicator :{
    //     type :Boolean,
    //     required: true,
    //     default : false
    // },

    bankReferenceNumber: {
        type: String,
    },

    paymentId: {
        type: String,
    },

    // otp: {
    //     type: String,
    //     required: true,
    //     unique: true,
    // },
});

module.exports = mongoose.model('onGoingOrders', onGoingOrdersSchema);
