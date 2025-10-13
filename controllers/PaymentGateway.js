const { Cashfree } = require('cashfree-pg');
const {mongoose} = require("mongoose");
// const {decrypt} = require("../utils/EncryptionAndDecryption.jsx");
const usersCollection = require('../models/Users.js');
const ongoingOrder = require("../models/OrderTypes/OngoingOrders.js")
const { v4: uuidv4 } = require('uuid');
const {Mutex}  = require('async-mutex');
const orderSummary = require("../models/orderSummary.js")
const usedOrderOTP = require("../models/TemporaryStorage/usedOTP.js");
const axios = require('axios');
const { verifyPaymentLogic } = require('../utils/paymentVerifier');
const {pollUnpaidOrdersForUser} = require('../utils/paymentVerifier.js');
const mutex = new Mutex();

require('dotenv').config();

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

exports.createPGOrder = async (req, res) => {

    try {
        const { vendorId } = req.body;
        const { filesWithConfigs } = req.body;
        const price = req.invoice.price.price;
        const customerData = req.customerData;
        const response = req.vendorData;

        if (!price) {
            return res.status(400).json({
                success: false,
                message: 'Price is required.',
            });
        }

        if (!(typeof price === 'number')) {
            return res.status(400).json({
                success: false,
                message: 'Price should be a number.',
            });
        }

        if (price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Price can't be negative",
            });
        }

        const orderId = uuidv4();
        //Create order in Ongoing Orders
        const onGoingDBResponse = await ongoingOrder.create({
                user: customerData._id,
                vendor: response._id,
                documents: filesWithConfigs,
                price,
                orderId
        });
        
        const {
            userId: customerUserId,
            firstName: customerName,
            mobileNumber: customerMobileNumber,
            email: customerEmail,
        } = customerData;



        let request = {
            order_meta: {
                payment_methods: "upi",
                return_url: "https://www.easer.co.in/dashboard/ongoing-orders",
                notify_url : "https://webhook.site/fdb03e69-181d-435f-9d79-1a3a95cbdf70"
                
            },
            order_amount: price,
            order_currency: 'INR',
            order_id:orderId ,
            customer_details: {
                customer_id: customerUserId,
                customer_phone: customerMobileNumber,
                customer_name: customerName,
                customer_email: customerEmail,
            },
        };

        Cashfree.PGCreateOrder('2023-08-01', request)
            .then((response) => {
                return res.status(200).json({
                    success: true,
                    message: 'PG order is created successfully',
                    data: 
                    {
                        payment_session_id : response?.data?.payment_session_id,
                        order_id : response?.data?.order_id
                    },
                });
            })
            .catch((error) => {
                console.log(
                    'Error occured while creating the PG order : ',
                    error
                );
                return res.status(500).json({
                    success: false,
                    message: 'Error Occured',
                    data: error.response.data.message,
                });
            });
    } catch (error) {
        console.log('Error occured while creating the PG order : ', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.verifyPayment = async (req, res) => {
  const notifyUrlResponse = req.notifyUrlResponse || null;
  const orderId = notifyUrlResponse?.data?.order?.order_id ?? req.body.orderId;

  const result = await verifyPaymentLogic({ orderId, notifyUrlResponse });
  return res.status(result.statusCode).json(result.body);
};

exports.pollUnpaidOrdersController = async (req, res) => {
  try {
    const userId = req.tokenPayload?.id || req.body.userId; // get user ID safely
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID missing" });
    }

    const results = await pollUnpaidOrdersForUser(userId);

    return res.status(200).json({
      success: true,
      message: "Polling complete",
      results,
    });
  } catch (err) {
    console.error("Error in polling controller:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



