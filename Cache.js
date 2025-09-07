const NodeCache = require('node-cache');

//Cache that will store frequently asked college codes for instant verification
const FrequentlyUsedCollegeCodes_Cache = new NodeCache();

//Cache that will store OTP for instant otp verification
const OTP_Cache = new NodeCache();

//Exporting all the caches
module.exports = {
    FrequentlyUsedCollegeCodes_Cache,
    OTP_Cache,
};
