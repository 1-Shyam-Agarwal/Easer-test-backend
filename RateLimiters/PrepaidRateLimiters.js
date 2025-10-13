const { rateLimit } = require('express-rate-limit');


const prepaidRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 30,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 1 hr.',
        });
    },
    legacyHeaders: false,
});

module.exports = {prepaidRateLimiter};