// controllers/Notification.js
const { messaging } = require("../utils/Firebase/firebase");
const usersCollection = require("../models/Users");



// Register FCM Token for the current session
async function storeFCMToken(req, res) {
  try {
    const { id } = req.tokenPayload;
    const { fcmToken } = req.body;

    // Basic validation
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is missing.",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing.",
      });
    }

    // Extract token from Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Find the user
    const user = await usersCollection.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find the matching session
    const session = user.sessions.find((s) => s.token === token);
    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Session not found for the provided token.",
      });
    }

    // Update FCM token
    session.fcmToken = fcmToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "FCM token stored successfully.",
    });

  } catch (e) {

    console.error(
      "Error occurred while storing the FCM token in the user sessions:",
      e
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}



async function sendNotification(fcmToken, title, body) {
  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      android: { priority: "high" },
      apns: { payload: { aps: { contentAvailable: true } } },
    };

    const response = await messaging.send(message);
    console.log("Notification sent successfully:", response);

  } catch (error) {
    console.error(" Error sending notification:", error);

    // Handle invalid or expired tokens
    if (error.code === "messaging/registration-token-not-registered") {
      console.log("Token invalid or expired. Removing from database...");
    }

    return { success: false, message: error.message };
  }
}


module.exports = { sendNotification ,storeFCMToken };
