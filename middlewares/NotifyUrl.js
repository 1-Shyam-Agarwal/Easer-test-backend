// cashfreeWebhookMiddleware.js
const { Cashfree } = require('cashfree-pg');
require('dotenv').config();

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

exports.cashfreeWebHook = async (req, res, next) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    const rawBody = req.rawBody;

    const verified = Cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

    if (!verified) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const payload = JSON.parse(rawBody);

    if (payload.type === "PAYMENT_SUCCESS_WEBHOOK") {
      req.notifyUrlResponse = payload;
      return next(); 
    } else {
      return res.status(400).json({ message: "Unsupported webhook type" });
    }

  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
