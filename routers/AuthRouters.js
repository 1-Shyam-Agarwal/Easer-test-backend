const express = require('express');
const router = express.Router();

//<---------------------------------------------------OTP Routers--------------------------------------------->

//Controller
const {
    resendOTP,
} = require('../controllers/AuthController/OtpControllers.js');

//Rate Limiter
const { resendOtpLimiter } = require('../RateLimiters/AuthRateLimiters.js');

//This route is used to resend otp at login and signup side.
router.post('/auth/resend-otp', resendOtpLimiter, resendOTP);

//<--------------------------------------------Custom Signup Routers------------------------------------------>
const {
    preCustomSignupCheckController,
    saveCustomSignupDetailsController,
} = require('../controllers/AuthController/SignupControllers.js');

const {
    preCustomSignupCheckLimiter,
    sendAuthOtpLimiter,
} = require('../RateLimiters/AuthRateLimiters.js');

const {
    sendAuthOtp,
    verifySignupOtp,
} = require('../controllers/AuthController/OtpControllers.js');

//Routing
//Used to check entered signup details and if all are fine then send otp.
router.post(
    '/auth/custom/pre-signup-check-and-send-otp',
    preCustomSignupCheckLimiter,
    preCustomSignupCheckController,
    sendAuthOtpLimiter,
    sendAuthOtp
);

//Used to verify otp and if otp is correct then create account
router.post(
    '/auth/otp-verify-and-create-account',
    preCustomSignupCheckLimiter,
    preCustomSignupCheckController,
    verifySignupOtp,
    saveCustomSignupDetailsController
);

//<------------------------------------------------Google signup Routers------------------------------------>

//Controllers
const {
    googlePreSignupCheckController,
    saveGoogleSignupAllDetailsController,
} = require('../controllers/AuthController/SignupControllers.js');

//Rate limiters
const {
    googlePreSignupCheckLimiter,
    saveGoogleSignupAllDetailsLimiter,
} = require('../RateLimiters/AuthRateLimiters.js');

//Routing
//This is used to cehck whether the googleToken is correct or not and email is already registered or not
router.get(
    '/auth/pre-google-signup-check/:googleToken',
    googlePreSignupCheckLimiter,
    googlePreSignupCheckController
);

//this is used to create account after validating the googleToken again and some extra information (collegeCode and mobileNumber)
router.post(
    '/auth/save-google-signup-details',
    saveGoogleSignupAllDetailsLimiter,
    saveGoogleSignupAllDetailsController
);

//<-----------------------------------------------------Login Routers---------------------------------------->

//Controllers
const {
    preCustomLoginCheckController,
    checkLoginPasswordController,
} = require('../controllers/AuthController/LoginControllers.js');

const {
    verifyLoginOtp,
} = require('../controllers/AuthController/OtpControllers.js');

// Rate Limiters
const {
    preCustomLoginCheckLimiter,
    verifyAuthOtpLimiter, // used for verify-login-password api and verify-login-otp
} = require('../RateLimiters/AuthRateLimiters.js');

//This routing is used to check whether the entered email is registered or not and if yes and user is customer then send otp.
router.get(
    '/auth/custom/pre-login-checks-and-send-otp/:email',
    preCustomLoginCheckLimiter,
    preCustomLoginCheckController,
    sendAuthOtp
);
//This route is used to verify login otp.
router.post('/auth/verify-login-otp', verifyAuthOtpLimiter, verifyLoginOtp);

//This routing is used to verify the entered login password
router.post(
    '/auth/verify-login-password',
    verifyAuthOtpLimiter,
    checkLoginPasswordController
);

//<-----------------------------------Google Login Routers------------------------------------------------>
const {
    googlePreLoginCheckController,
} = require('../controllers/AuthController/LoginControllers.js');

const {
    googlePreLoginCheckControllerLimiter,
} = require('../RateLimiters/AuthRateLimiters.js');
router.get(
    '/auth/google/pre-login-checks/:googleToken',
    googlePreLoginCheckControllerLimiter,
    googlePreLoginCheckController
);

//<---------------------------------------------Forget password routers------------------------------------>

const {
    resetPasswordToken,
    resetPassword,
} = require('../controllers/AuthController/ForgetPassword.js');

router.post('/reset-password-token', resetPasswordToken);
router.post('/reset-password', resetPassword);

module.exports = router;
