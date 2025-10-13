// utils/paymentVerifier.js
const mongoose = require('mongoose');
const { Mutex } = require('async-mutex');   // npm i async-mutex
const Cashfree = require('cashfree-pg').Cashfree;
const ongoingOrder = require('../models/OrderTypes/OngoingOrders');
const orderSummary = require('../models/orderSummary');
const usedOrderOTP = require('../models/TemporaryStorage/usedOTP');

// map of per-order mutexes
const orderMutexMap = new Map();

function getOrderMutex(orderId) {
  if (!orderMutexMap.has(orderId)) orderMutexMap.set(orderId, new Mutex());
  return orderMutexMap.get(orderId);
}

/**
 * Core logic: verify & update a single order.
 * Returns { statusCode, body, updatedOrder? }
 * DOES NOT call res.send()
 */
async function verifyPaymentLogic({ orderId, notifyUrlResponse = null }) {
  if (!orderId) {
    return { statusCode: 400, body: { success: false, message: "Missing orderId" } };
  }

  let paymentInfo;
  try {
    if (!notifyUrlResponse) {
      const verification_response = await Cashfree.PGOrderFetchPayments('2023-08-01', orderId);
      paymentInfo = verification_response?.data?.[0];
      if (!paymentInfo) {
        return { statusCode: 400, body: { success: false, message: "Unable to fetch payment info." } };
      }
      if (paymentInfo.payment_status !== 'SUCCESS') {
        return { statusCode: 400, body: { success: false, message: "Payment not successful." } };
      }
    } else {
      paymentInfo = notifyUrlResponse?.data?.payment;
      if (!paymentInfo) {
        return { statusCode: 400, body: { success: false, message: "Webhook missing payment info." } };
      }
    }

    // find order
    const orderDoc = await ongoingOrder.findOne({ orderId: orderId});
    if (!orderDoc) {
      return { statusCode: 404, body: { success: false, message: "Order not found" } };
    }

    // per-order mutex to avoid races for this order
    const mutex = getOrderMutex(orderId);
    const release = await mutex.acquire();

    try {
      // quick re-check inside lock
      if (orderDoc.paymentStatus === 'paid') {
        return { statusCode: 200, body: { success: true, message: "Order already paid." } };
      }

      // apply payment fields
      orderDoc.paymentTime = paymentInfo.payment_time;
      orderDoc.bankReferenceNumber = paymentInfo.bank_reference;
      orderDoc.paymentId = paymentInfo.cf_payment_id;

      // start DB transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const summaryResponse = await orderSummary.findOneAndUpdate(
          { date: today, user: orderDoc.vendor },
          { $inc: { onGoingOrders: 1 }, $setOnInsert: { date: today, user: orderDoc.vendor } },
          { new: true, upsert: true, session }
        );

        // Fetch or create usedOTP doc
        let usedOTPResponse = await usedOrderOTP.findOne().session(session);
        if (!usedOTPResponse) {
          usedOTPResponse = new usedOrderOTP({ orderOtps: [] });
          await usedOTPResponse.save({ session });
        }

        // generate OTP safely (loop until unique)
        let OTP;
        do {
          const starting = 1000 + 10 * (Math.max(0, summaryResponse.onGoingOrders - 1));
          const modification = Math.floor(Math.random() * 10);
          OTP = starting + modification;
        } while (usedOTPResponse.orderOtps.includes(String(OTP)));

        usedOTPResponse.orderOtps.push(String(OTP));
        await usedOTPResponse.save({ session });

        // compute time estimates using existing paid waiting orders
        const ongoingOrderResponse = await ongoingOrder.find({
          vendor: orderDoc.vendor,
          orderStatus: "waiting",
          paymentStatus: "paid"
        }).populate("user").session(session);

        // include the current order (since it will become paid)
        ongoingOrderResponse.push(orderDoc);

        let pageCount = 0;

        ongoingOrderResponse.forEach(order => {
            let n = order.documents.length;
            for(let i=0 ; i<n ; i++)
            {
                pageCount += (order.documents[i].pageCount * order.documents[i].fileConfigs["copies"]);
            }
        })

        let totalTime = Math.ceil((pageCount * 1.25) / 60);
        totalTime = Math.ceil(totalTime + (ongoingOrderResponse.length) * 0.80 + 3);

        orderDoc.otp = OTP;
        orderDoc.remainingTime = totalTime;
        orderDoc.paymentStatus = "paid";

        await orderDoc.save({ session });

        await session.commitTransaction();

        return { statusCode: 200, body: { success: true, message: "Order placed successfully." }, updatedOrder: orderDoc };
      } catch (txnErr) {
        await session.abortTransaction();
        console.error("Transaction error:", txnErr);
        return { statusCode: 500, body: { success: false, message: "Order update failed due to internal error." } };
      } finally {
        session.endSession();
      }
    } finally {
      // important: always release the lock
      release();
      orderMutexMap.delete(orderId);
    }
  } catch (err) {
    console.error("verifyPaymentLogic error:", err);
    return { statusCode: 500, body: { success: false, message: "Unable to verify payment." } };
  }
}

async function pollUnpaidOrdersForUser(userId) {
  const unpaidOrders = await ongoingOrder.find({ user: userId, paymentStatus: "unpaid" }).lean();

  const results = [];
  for (const o of unpaidOrders) {
    // call the core logic; DO NOT call the controller
    const r = await verifyPaymentLogic({ orderId: o.orderId });
    results.push({ orderId: o.orderId, result: r });
    // optionally: small delay between calls to avoid hitting provider rate-limits
  }
  return results;
}

module.exports = { verifyPaymentLogic , pollUnpaidOrdersForUser};
