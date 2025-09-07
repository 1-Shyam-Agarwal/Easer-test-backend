const { rateLimit } = require('express-rate-limit');

const createMailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1hr
    limit: 20,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message:
                'Too many mails sent in short duration. Please try after 1hr',
        });
    },
});

module.exports = { createMailLimiter };
