const express = require('express');
const router = express.Router();
const {
    auth,
    isCustomer,
    isVendor,
    isAdmin,
} = require('../middlewares/Auth.js');

const {
    createMail,
} = require('../controllers/OutboxOrdersControllers/CreateMail.js');
const { createMailLimiter } = require('../RateLimiters/MailRateLimiters.js');
router.post(
    '/create-outbox-mail',
    auth,
    isCustomer,
    createMailLimiter,
    createMail
);

const {
    getCustomerMails,
} = require('../controllers/OutboxOrdersControllers/getMail.js');
router.get('/fetch-customer-mails', auth, isCustomer, getCustomerMails);

const {
    getVendorMails,
} = require('../controllers/OutboxOrdersControllers/getMail.js');
router.get('/fetch-vendor-mails', auth, isVendor, getVendorMails);

const {
    getFilteredMailsByFileName,
} = require('../controllers/OutboxOrdersControllers/getMail.js');
router.get(
    '/fetch-filtered-mails-by-filename',
    auth,
    isCustomer,
    getFilteredMailsByFileName
);

const {
    getSpecificMailDetails,
} = require('../controllers/OutboxOrdersControllers/getMail.js');
router.get(
    '/fetch-specific-mail-details/:mailId',
    auth,
    getSpecificMailDetails
);

const {
    getFilteredMailsByCustomerName,
} = require('../controllers/OutboxOrdersControllers/getMail.js');
router.get(
    '/fetch-filtered-mails-by-customer-name',
    auth,
    isVendor,
    getFilteredMailsByCustomerName
);

module.exports = router;
