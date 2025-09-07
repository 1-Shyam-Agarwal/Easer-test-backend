const { Cashfree } = require('cashfree-pg');
// const {decrypt} = require("../utils/EncryptionAndDecryption.jsx");
const usersCollection = require('../models/Users.js');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

exports.createPGOrder = async (req, res) => {
    const customerId = req.tokenPayload.id;

    try {
        const { vendorId, price } = req.body;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: 'Vendor id is required.',
            });
        }

        if (!(typeof vendorId === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Vendor id should be a string.',
            });
        }

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

        const response = await usersCollection
            .findOne({ userId: vendorId })
            .populate('vendorAdditionalDetails');

        if (!response) {
            return res.status(400).json({
                success: false,
                message: 'Vendor id is invalid.',
            });
        }

        const customerData = await usersCollection.findOne({
            _id: customerId,
            role: 'customer',
        });

        if (!customerData) {
            return res.status(400).json({
                success: false,
                message: 'Customer id is invalid.',
            });
        }
        
        const {
            userId: customerUserId,
            firstName: customerName,
            mobileNumber: customerMobileNumber,
            email: customerEmail,
        } = customerData;



        let request = {
            order_meta: {
                payment_methods: "upi",
                return_url: "https://www.easer.co.in/check-order",
                // notify_url: "https://localhost:3000"
            },
            order_amount: 1,
            order_currency: 'INR',
            order_id: uuidv4(),
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
                    data: response.data,
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
    try {
        let { orderId, vendorId } = req.body;

        console.log('skjndnkcskjksckjskajskkljld : ', req.body);
        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: 'Vendor id is required.',
            });
        }

        if (!(typeof vendorId === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Vendor id should be a string.',
            });
        }

        const response = await usersCollection
            .findOne({ userId: vendorId })
            .populate('vendorAdditionalDetails');

        if (!response) {
            return res.status(400).json({
                success: false,
                message: 'Vendorid is invalid.',
            });
        }

        // const CLIENT_ID = decrypt(response.vendorAdditionalDetails.paymentGatewayInfo.MID);
        // const CLIENT_SECRET = decrypt(response.vendorAdditionalDetails.paymentGatewayInfo.saltKey);

        Cashfree.PGOrderFetchPayments('2023-08-01', orderId)
            .then((response) => {
                return res.status(200).json({
                    success: true,
                    message: 'payment verified successfully',
                    response: response.data,
                });
            })
            .catch((error) => {
                console.log(
                    'error occured while verifying the payment : ',
                    error
                );
                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
