const express = require('express');
const router = express.Router();

//<------------------------------------------GetInTouch------------------------------------------------------->

const { getInTouch } = require('../controllers/getInTouch.js');
router.post('/get-in-touch', getInTouch);

module.exports = router;
