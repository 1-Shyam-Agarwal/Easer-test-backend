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

// router.post("/validate-file-format-and-size-and-upload",auth,isUser, validateFileFormatAndSizeController , uploadDocument);
// router.post("/validate-order", auth , isUser , validateOrder);
router.post('/create-order', auth, isCustomer, createOrder);
// router.post("/delete-document" ,auth , isUser ,deleteFileFromCloudinary);

// // *************************************************************************************************************************

//                                                 //   Get Orders

// // ***************************************************************************************************************************
// const {getAllOrdersOfVendor, getAllCancelledOrders ,  getAllOrdersOfVendor, getAllSpecificUnreceivedOrders , getAllSpecificOrderHistory} = require("../controllers/PrepaidOrderControllers/GetOrders.js");
const {
    getAllSpecificOnGoingOrders,
    getSpecificOnlineOrderDetails,
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
// router.post("/fetch-order-history",auth,getAllSpecificOrderHistory);

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

// const{ sendMessageToCustomer , SetNotifyCustomerIndicator ,setProcessOrderIndicator,desetProcessOrderIndicator,completeOrder,OrderReceiver } = require("../controllers/PrepaidOrderControllers/OrderOperations.js");

// router.post("/set-notify-customer-indicator" ,auth,isVendor, SetNotifyCustomerIndicator);
// router.post("/send-message-to-customer",auth,isVendor,sendMessageToCustomer);
// router.post("/set-process-order-indicator" ,auth,isVendor, setProcessOrderIndicator);
// router.post("/complete-user-order" ,auth ,isVendor,completeOrder );
// router.post("/order-history-creator",auth , isVendor,OrderReceiver);
// router.post("/deset-process-indicator" , auth , isVendor , desetProcessOrderIndicator );

module.exports = router;
