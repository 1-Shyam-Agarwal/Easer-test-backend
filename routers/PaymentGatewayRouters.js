const express = require('express');
const router = express.Router();

const {
    createPGOrder,
    verifyPayment,
} = require('../controllers/PaymentGateway.js');

const {validateOrderAndPriceGenerationMiddleware} = require("../middlewares/ValidateOrderAndVerifyPrice.js");
const {
    auth,
    isCustomer,
    isVendor,
    isAdmin,
} = require('../middlewares/Auth.js');

router.post('/create-pg-order', auth, isCustomer, validateOrderAndPriceGenerationMiddleware , createPGOrder);
router.post('/verify-payment', auth, isCustomer, verifyPayment);

module.exports = router;
