const mongoose = require('mongoose');
const UnreceivedOrders = require('./OrderTypes/UnreceivedOrders');

const orderSummarySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },

    date : {
        type : Date,
        required : true,
        default : Date.now()
    },


    onGoingOrders: {
        type : Number,
        required: true,
        default : 0
    },

    UnreceivedOrders: {
        type : Number,
        required: true,
        default : 0
    },

    orderHistory: {
        type : Number,
        required: true,
        default : 0
    },

    cancelledOrders : {
        type : Number,
        required: true,
        default : 0
    },

    usedOTP : [{
        type : Number
    }]
});


module.exports = mongoose.model('orderSummary', orderSummarySchema);
