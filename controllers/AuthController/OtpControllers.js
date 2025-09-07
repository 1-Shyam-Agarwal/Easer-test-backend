//Models used for OTP generation and verfication
const usersCollection = require('../../models/Users.js');
const registeredColleges = require('../../models/RegisteredColleges.js');
const OTPCollection = require('../../models/TemporaryStorage/OTP.js');
const { FrequentlyUsedCollegeCodes_Cache } = require('../../Cache.js');

//for sychronisation
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

//caching for improved performance
const { OTP_Cache } = require('../../Cache.js');

//Libraries needed for OTP generation anv verification
const otpGenerator = require('otp-generator');

//Function for sending the OTP mail to the users + OTPTemplate
const mailSender = require('../../utils/mailSender.js');
const { OTPTemplate } = require('../../MailTemplates.js');

//Used for creating session
const jwt = require('jsonwebtoken');

// USED FOR RESEND THE OTP AT LOGIN AND SIGNUP SIDE
async function resendOTP(req, res) {
    let { email, type } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required.',
        });
    }

    //Removing spaces from left and right
    email = email.trim().toLowerCase();

    // Validate email format using a regular expression
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format.',
        });
    }

    // Validating type parameter
    if (!type) {
        return res.status(400).json({
            success: false,
            message: 'Type is required.',
        });
    }

    if (!['signup', 'login'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: 'Wrong type.',
        });
    }

    //checking for existing email
    if (type === 'signup') {
        try {
            const isEmailAlreadyExists = await usersCollection.findOne({
                email,
            });

            if (isEmailAlreadyExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered.',
                });
            }
        } catch (error) {
            console.log(
                "Error occured while checking email existence during sending otp at user's signup",
                error
            );
            return res.status(500).json({
                success: false,
                message: 'Internal Server problem.',
            });
        }
    } else if (type === 'login') {
        try {
            const isEmailAlreadyExists = await usersCollection.findOne({
                email,
            });

            if (!isEmailAlreadyExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is not registered.',
                });
            }
        } catch (error) {
            console.log(
                `Error occured while checking email existence during otp verification at user's ${type} : `,
                error
            );
            return res.status(500).json({
                success: false,
                message: 'Internal Server problem.',
            });
        }
    }

    //Preparing OTP
    const Otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    //Updating OTP in OTP_cache

    let OtpPayload = {
        expiredAt: Date.now() + 5 * 60 * 1000,
        Otp: Otp,
    };
    OTP_Cache.set(email, OtpPayload, 60 * 5);

    //Updating in the OTP_Model
    const release = await mutex.acquire();
    try {
        OtpPayload['email'] = email;
        const otpBody = await OTPCollection.findOneAndUpdate(
            { email: email },
            { $set: OtpPayload },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.log(
            `Error occured while writing otp record in the otp model during sending OTP at user's ${type}: `,
            error
        );
    } finally {
        release();
    }

    //Sending OTP in background
    mailSender(email, 'OTP Verification - Easer', OTPTemplate(Otp)).catch(
        (error) => {
            console.log('SIGNUP OTP is not sent successfully : ', error);
        }
    );

    res.status(200).json({
        success: true,
        message: `OTP Sent Successfully`,
    });
}

// USED AT SIGNUP SIDE /LOGIN SIDE  JUST AFTER THE PRE-SIGNUP-CHECK/PRE-LOGIN-CHECK MIDDLEWARE FOR SENDING THE OTP FOR THE FIRST TIME
sendAuthOtp = async (req, res) => {
    let email = req.body.email || req.params.email;
    email = email.trim().toLowerCase();

    //Preparing OTP
    const Otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    //Updating OTP in OTP_cache
    let OtpPayload = {
        expiredAt: Date.now() + 5 * 60 * 1000,
        Otp: Otp,
    };

    OTP_Cache.set(email, OtpPayload, 60 * 5);

    //Updating in the OTP_Model
    const release = await mutex.acquire();
    try {
        OtpPayload['email'] = email;
        const otpBody = await OTPCollection.findOneAndUpdate(
            { email: email },
            { $set: OtpPayload },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.log(
            `Error occured while writing otp record in the otp model during sending OTP at user's ${type}: `,
            error
        );
    } finally {
        release();
    }

    //Sending OTP in background
    mailSender(email, 'OTP Verification - Easer', OTPTemplate(Otp))
        .then(() => {
            console.log('The Auth otp is sent successfully.');
        })
        .catch((error) => {
            console.log('Error Occured while sending the Auth OTP : ', error);
        });

    res.status(200).json({
        success: true,
        message: `OTP Sent Successfully`,
    });
};

//MIDDLEWARE (USED BEFORE SAVING THE DATA FETCHED FROM THE CUSTOM SIGNUP FOR ENTERED OTP VERIFICATION)
async function verifySignupOtp(req, res, next) {
    //Extracting the info from the body
    const typedOtp = req.body.otp;
    let email = req.body.email;

    if (!typedOtp) {
        return res.status(400).json({
            success: false,
            message: 'Otp is required.',
        });
    }

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(typedOtp)) {
        return res.status(500).json({
            success: false,
            message: 'OTP should be of 6 length and numeric only.',
        });
    }

    let otpStatus;
    //Checking whether OTP is stored in cache or not and then verifying
    if (OTP_Cache.has(email)) {
        const otpData = OTP_Cache.get(email);
        if (Date.now() > otpData.expiredAt) {
            return res.status(401).json({
                success: false,
                message: 'OTP is expired',
            });
        } else {
            otpStatus = typedOtp === otpData?.Otp;
        }
    }
    //Fallback System if otp is not present in cache due to crashes or other reasons
    else {
        try {
            const response = await OTPCollection.findOne({ email });

            if (!response) {
                return res.status(401).json({
                    success: false,
                    message: 'OTP is expired.',
                });
            }

            if (!(response?.expiredAt > Date.now())) {
                return res.status(401).json({
                    success: false,
                    message: 'OTP is expired.',
                });
            }

            let otpPayload = {
                expiredAt: response?.expiredAt,
                Otp: response?.Otp,
            };

            OTP_Cache.set(email, otpPayload, 5 * 60);
            otpStatus = typedOtp === otpPayload?.Otp;
        } catch (error) {
            console.log(
                `Error occured while fetching otp info while verfication otp at customer's ${type} : `,
                error
            );
            return res.status(500).json({
                success: false,
                message: 'Internal Server Problem',
            });
        }
    }

    if (otpStatus) {
        return next();
    } else {
        return res.status(401).json({
            success: false,
            message: 'The OTP is incorrect',
        });
    }
}

//USED FOR VERIFICATION OF OTP WHILE CUSTOMER LOGIN USING CUSTOM LOGIN
async function verifyLoginOtp(req, res, next) {
    //Extracting the info from the body
    const typedOtp = req.body.otp;
    let email = req.body.email;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required.',
        });
    }

    //Removing spaces from left and right
    email = email.trim().toLowerCase();

    // Validate email format using a regular expression
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format.',
        });
    }

    //Checking otp is given by customer or not.
    if (!typedOtp) {
        return res.status(400).json({
            success: false,
            message: 'Otp is required.',
        });
    }

    //Validating the format of the otp
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(typedOtp)) {
        return res.status(500).json({
            success: false,
            message: 'OTP should be of 6 length and numeric only.',
        });
    }

    //Checking whether the entered email is already registered or not.
    let isEmailAlreadyExists;
    try {
        isEmailAlreadyExists = await usersCollection.findOne({ email });

        if (!isEmailAlreadyExists) {
            return res.status(409).json({
                success: false,
                message: 'Email is not registered.',
            });
        }
    } catch (error) {
        console.log(
            'Error occured while validating email of user during verifying loginOTP : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    let otpStatus;
    //Checking whether OTP is stored in cache or not and then verifying
    if (OTP_Cache.has(email)) {
        const otpData = OTP_Cache.get(email);
        if (Date.now() > otpData.expiredAt) {
            return res.status(401).json({
                success: false,
                message: 'OTP is expired',
            });
        } else {
            otpStatus = typedOtp === otpData?.Otp;
        }
    }
    //Fallback System if otp is not present in cache due to crashes or other reasons
    else {
        try {
            const response = await OTPCollection.findOne({ email });

            if (!response) {
                return res.status(401).json({
                    success: false,
                    message: 'OTP is expired.',
                });
            }

            if (!(response?.expiredAt > Date.now())) {
                return res.status(401).json({
                    success: false,
                    message: 'OTP is expired.',
                });
            }

            let otpPayload = {
                expiredAt: response?.expiredAt,
                Otp: response?.Otp,
            };

            OTP_Cache.set(email, otpPayload, 5 * 60);
            otpStatus = typedOtp === otpPayload?.Otp;
        } catch (error) {
            console.log(
                `Error occured while fetching otp info while verfication otp at customer's ${type} : `,
                error
            );
            return res.status(500).json({
                success: false,
                message: 'Internal Server Problem',
            });
        }
    }

    if (otpStatus) {
        //Preparing payload for JWT token for login
        const payload = {
            email: email.toLowerCase().trim(),
            id: isEmailAlreadyExists._id,
            role: 'customer',
        };

        //Preparing the JWT token for authentication and authorization
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1y',
        });

        return res.status(200).json({
            success: true,
            easerSecurityTicket: token,
            profileImage: isEmailAlreadyExists.profileImage,
            message: 'Customer is logged in successfully.',
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'The OTP is incorrect',
        });
    }
}

//<---------------------------------------------------------END------------------------------------------------->

module.exports = {
    resendOTP,
    sendAuthOtp,
    verifySignupOtp,
    verifyLoginOtp,
};
