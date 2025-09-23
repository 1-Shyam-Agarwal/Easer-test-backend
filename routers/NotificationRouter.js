const express = require('express');
const router = express.Router();

const { auth } = require("../middlewares/Auth.js");

//<----------------------------------------- Send Push Notification -------------------------------------------->

const {sendNotification , storeFCMToken} = require("../controllers/Notification.js");

router.post("/send-notification" , sendNotification);
router.post("/store-fcm-token" , auth , storeFCMToken);

module.exports = router;