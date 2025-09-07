const { rateLimit } = require('express-rate-limit');

//PreCustomSignupCheck rate limiter
const preCustomSignupCheckLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 20,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

//sendAuthOtp rate limiter
const sendAuthOtpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 15,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

//googlePreSignupCheck Limiter
const googlePreSignupCheckLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 20,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

//saveGoogleSignupAllDetails Limiter
const saveGoogleSignupAllDetailsLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 1day
    limit: 10,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 day.',
        });
    },
    legacyHeaders: false,
});

//preCustomLoginCheck limiter
const preCustomLoginCheckLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 17,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

//resendOtp Rate Limiter
const resendOtpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 15,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

//verifyAuthOtp Limiter
const verifyAuthOtpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 15,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

const googlePreLoginCheckControllerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 15,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

module.exports = {
    preCustomSignupCheckLimiter,
    sendAuthOtpLimiter,
    googlePreSignupCheckLimiter,
    saveGoogleSignupAllDetailsLimiter,
    preCustomLoginCheckLimiter,
    googlePreLoginCheckControllerLimiter,
    resendOtpLimiter,
    verifyAuthOtpLimiter,
};
