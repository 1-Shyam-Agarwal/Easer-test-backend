const express = require('express');
const router = express.Router();

const { auth, isUser, isVendor, isAdmin } = require('../middlewares/Auth.js');

const {
    validateAndUpdateName,
    validateAndUpdatePassword,
    changeMobileNumber,
} = require('../controllers/ResetDetailsControllers/resetDetails.js');
router.post('/validate-and-update-name', auth, validateAndUpdateName);
router.post('/validate-and-update-password', auth, validateAndUpdatePassword);
router.post('/update-mobile-number', auth, changeMobileNumber);

module.exports = router;
