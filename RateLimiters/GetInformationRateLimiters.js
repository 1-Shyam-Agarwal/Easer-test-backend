const { rateLimit } = require('express-rate-limit');

const getRegisteredCollegesLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 1hr
    limit: 25,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try after 30 mins.',
        });
    },
});

module.exports = { getRegisteredCollegesLimiter };
