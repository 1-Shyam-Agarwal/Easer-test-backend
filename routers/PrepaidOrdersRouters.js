const express = require('express');
const router = express.Router();

const {
    auth,
    isCustomer,
    isVendor,
    isAdmin,
} = require('../middlewares/Auth.js');

// // *************************************************************************************************************************

//                                                 //   Place Order

// // ***************************************************************************************************************************

// const {validateFileFormatAndSizeController , deleteFileFromCloudinary ,validateOrder ,cancellationOfDocuments , uploadDocument } = require("../controllers/PrepaidOrderControllers/printOrder.js");
const {
    createOrder,
} = require('../controllers/PrepaidOrderControllers/CreateOrder.js');

const {
    createOrderHistory
} = require("../controllers/PrepaidOrderControllers/OrderOperations.js");

// router.post("/validate-file-format-and-size-and-upload",auth,isUser, validateFileFormatAndSizeController , uploadDocument);
// router.post("/validate-order", auth , isUser , validateOrder);
router.post('/create-order', auth, isCustomer, createOrder);
router.post('/create-order-history' , auth , isCustomer , createOrderHistory);
// router.post("/delete-document" ,auth , isUser ,deleteFileFromCloudinary);

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

//                                                 //   Cancellation of Order

// // ***************************************************************************************************************************

// const{setCancellationIndicators, desetCancellationIndicators , orderCancellation } = require("../controllers/PrepaidOrderControllers/OrderCancellation.js");

// router.post("/set-cancellation-indicators" , auth , setCancellationIndicators);
// router.post("/deset-cancellation-indicators" , auth , desetCancellationIndicators);
// router.post("/order-cancellation" , auth , orderCancellation);

// // *************************************************************************************************************************

//                                                 //   Order operations

// // ***************************************************************************************************************************

const{completeOrder , ongoingOrderCount_TimeCalculation} = require("../controllers/PrepaidOrderControllers/OrderOperations.js");

router.post("/complete-user-order" ,auth ,isVendor,completeOrder );
router.post("/get-time-estimate-and-orders-count" , auth , isCustomer , ongoingOrderCount_TimeCalculation );


const {validateOrderAndPriceGeneration} = require("../controllers/PrepaidOrderControllers/validation.js");

router.post("/validate-order-and-generate-price" , auth , isCustomer , validateOrderAndPriceGeneration);

// *************************************************************************************************************************


module.exports = router;
