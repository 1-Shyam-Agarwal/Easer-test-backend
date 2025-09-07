const express = require('express');
const router = express.Router();
const {
    auth,
    isCustomer,
    isVendor,
    isAdmin,
} = require('../middlewares/Auth.js');

//<---------------------------------------GENERAL INFORMATION-------------------------------------------------->

//Get All Registered Colleges
const {
    getAllRegisteredCollegesController,
} = require('../controllers/GetInformationControllers/GeneralControllers.js');

//Importing getRegisteredColleges Rate_Limiter
const {
    getRegisteredCollegesLimiter,
} = require('../RateLimiters/GetInformationRateLimiters.js');

router.get(
    '/get-all-colleges',
    getRegisteredCollegesLimiter,
    getAllRegisteredCollegesController
);

//
const {
    getUserRole,
    getUserId,
    getUserInformation,
} = require('../controllers/GetInformationControllers/GeneralControllers.js');

router.post('/get-user-information', auth, getUserInformation);
router.post('/get-user-role', auth, getUserRole);
router.post('/get-user-id', auth, getUserId);

// //<-------------------------------------Get Customer related Information ------------------------------------->

// //<-------------------------------------Get Vendor related Information --------------------------------------->

// const {
//         getShopStatus,
//         getShopInfo
//       } = require("../controllers/GetInformationControllers/GetUserInformation.js");

// router.post("/get-shop-status" ,auth , isUser, getShopStatus);
// router.post("/get-shop-information" , getShopInfo)

const {
    getFilteredVendorsWithMinimumDetailsController,
} = require('../controllers/GetInformationControllers/VendorRelatedControllers.js');
const {
    getAllVendorPriceDetails,
} = require('../controllers/GetInformationControllers/vendorRelatedControllers.jsx');

// router.post("/get-filtered-vendors" , auth , getFilteredVendorsController);
// // router.post("/validate-print-order-vendor" ,auth,isUser, validatePrintOrderVendor);
router.post(
    '/get-all-vendor-price-details-and-final-amount',
    auth,
    isCustomer,
    getAllVendorPriceDetails
);
router.get(
    '/get-filtered-vendors-with-minimum-details',
    auth,
    isCustomer,
    getFilteredVendorsWithMinimumDetailsController
);

module.exports = router;
