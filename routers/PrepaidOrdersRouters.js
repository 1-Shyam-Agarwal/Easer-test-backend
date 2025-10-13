const express = require('express');
const router = express.Router();

const {
    auth,
    isCustomer,
    isVendor,
    isAdmin,
} = require('../middlewares/Auth.js');

// // *************************************************************************************************************************

//                                                 //   Create Order history

// // ***************************************************************************************************************************


const {
    createOrderHistory
} = require("../controllers/PrepaidOrderControllers/OrderOperations.js");

router.post('/create-order-history' , auth , isCustomer , createOrderHistory);

// // *************************************************************************************************************************

//                                                 //   Get Orders

// // ***************************************************************************************************************************
const { getAllSpecificOrderHistory} = require("../controllers/PrepaidOrderControllers/GetOrders.js");
const {
    getAllSpecificOnGoingOrders,
    getSpecificOnlineOrderDetails,
    getOngoingOrdersCount,
    getAllSpecificUnreceivedOrders
} = require('../controllers/PrepaidOrderControllers/GetOrders.js');

// router.post("/get_all_orders_of_vendor" , auth , isCustomer , getAllOrdersOfVendor);
// router.post("/get-all-cancelled-orders",auth, getAllCancelledOrders);
router.post(
    '/get_all_specific_user_on_going_orders',
    auth,
    getAllSpecificOnGoingOrders
);
router.post('/get-specific-online-order', auth, getSpecificOnlineOrderDetails);
// router.post("/get-all-specific-unreceived-orders" , auth , getAllSpecificUnreceivedOrders);
router.post("/fetch-order-history",auth,getAllSpecificOrderHistory);
router.get("/fetch-unreceived-order" , auth , isVendor , getAllSpecificUnreceivedOrders)
router.get('/get-order-count' , auth , isVendor , getOngoingOrdersCount);



// // *************************************************************************************************************************

//                                                 //   Order operations

// // ***************************************************************************************************************************

const{completeOrder , ongoingOrderCount_TimeCalculation} = require("../controllers/PrepaidOrderControllers/OrderOperations.js");

router.post("/complete-user-order" ,auth ,isVendor,completeOrder );
router.post("/get-time-estimate-and-orders-count" , auth , isCustomer , ongoingOrderCount_TimeCalculation );


const {validateOrderAndPriceGeneration} = require("../controllers/PrepaidOrderControllers/Validation.js");

router.post("/validate-order-and-generate-price" , auth , isCustomer , validateOrderAndPriceGeneration);

// *************************************************************************************************************************


module.exports = router;
