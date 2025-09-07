const usersCollection = require('../../models/Users.js');
const registeredColleges = require('../../models/RegisteredColleges.js');

//Cache for caching frequently used collegeCodes
const { FrequentlyUsedCollegeCodes_Cache } = require('../../Cache.js');

//used for creating unique id for user
const { v4: uuidv4 } = require('uuid');

//Used for creating session
const jwt = require('jsonwebtoken');

const oauth2Client = require('../../utils/googleClients.js');
const axios = require('axios');
const googleSignupTemp = require('../../models/TemporaryStorage/googleSignupTemp.js');

//<---------------------------------------------------FOR USER AUTHENICATION --------------------------------->

//<---------------------------------------------PreSignupChecks-------------------------------------->

//GET REQUEST USING ROUTE PARAMS (MIDDLEWARE)
async function preCustomSignupCheckController(req, res, next) {
    //Extracting user signup data from the request body.
    //userSignupInfo contains 3 fields -> collegeCode , email and mobile Number
    let { email, collegeCode, mobileNumber } = req.body;

    //validate the details
    if (!email || !mobileNumber || !collegeCode) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required.',
        });
    }

    //Removing spaces from left and right
    email = email.trim().toLowerCase();
    mobileNumber = mobileNumber.trim();

    // Validate email format using a regular expression
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format.',
        });
    }

    //validate the mobileNumber
    const numberRegex = /^[6-9]\d{9}$/;
    if (!numberRegex.test(mobileNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number',
        });
    }

    // Validate the collegeCode
    let isCollegeValid;
    try {
        //fallback system for caching
        if (!FrequentlyUsedCollegeCodes_Cache.has(collegeCode)) {
            isCollegeValid = await registeredColleges.findOne({
                collegeCode: collegeCode,
            });

            if (!isCollegeValid) {
                return res.status(409).json({
                    success: false,
                    message:
                        'This college is not registered with our services.',
                });
            }

            //Caching
            FrequentlyUsedCollegeCodes_Cache.set(
                collegeCode,
                isCollegeValid._id,
                60 * 60
            );
        } else {
            isCollegeValid = {
                _id: FrequentlyUsedCollegeCodes_Cache.get(collegeCode),
            };
        }
    } catch (error) {
        console.log(
            'Error occured while validating college code of user during custom preSignupCheck : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    //checking for existing email
    try {
        const isEmailAlreadyExists = await usersCollection.findOne({ email });

        if (isEmailAlreadyExists) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered.',
            });
        }
    } catch (error) {
        console.log(
            'Error occured while validating email of user during custom preSignupCheck : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    //This is attahced for the time of create-account when this middleware serves the verifySignupOtp and create account.
    req.body.collegeId = isCollegeValid._id;

    //Lowercased and trimmed email
    req.body.email = email;

    //trimmed mobileNumber
    req.body.mobileNumber = mobileNumber;

    next();
}

//GET REQUEST
//THIS FUNCTION WILL CHECK WHETHER THE PROVIDED GOOGLE TOKEN AND EXTARCTED INFO IS CORRECT OR NOT
async function googlePreSignupCheckController(req, res) {
    const googleToken = req.params.googleToken;

    if (!googleToken) {
        return res.status(400).json({
            success: false,
            message: 'No access token provided',
        });
    }

    let googleRes;
    try {
        googleRes = await oauth2Client.getToken(googleToken);

        oauth2Client.setCredentials(googleRes.tokens);

        googleRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
        );

        if (googleRes.status !== 200) {
            return res.status(400).json({
                success: false,
                message: 'Failed to verify google token.',
            });
        }
    } catch (error) {
        console.log(
            'Error occured while verifying and parsing the google token during google preSignupCheck : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem.',
        });
    }

    // Extract user info
    const googleTempAccountId = uuidv4();
    const { email, family_name, given_name, picture } = googleRes.data;
    const formatted_email = email.trim().toLowerCase();

    try {
        const isEmailAlreadyExists = await usersCollection.findOne({
            email: formatted_email,
        });

        if (isEmailAlreadyExists) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered.',
            });
        }
    } catch (error) {
        console.log(
            'Error occured while validating email of user during google preSignupCheck : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    try {
        const response = await googleSignupTemp.create({
            email,
            firstName: given_name,
            lastName: family_name ? family_name : '',
            picture,
            id: googleTempAccountId,
        });
    } catch (e) {
        console.log(
            'Error occured while creating a googleTempSignup during google preSignupCheck : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    res.status(200).json({
        success: true,
        message: 'google token verified successfully',
        userData: {
            googleId: googleTempAccountId,
        },
    });
}

//<----------------------------------------------CreateAccount-------------------------------------------->

//POST REQUEST
async function saveCustomSignupDetailsController(req, res) {
    //extract details
    const collegeCode = req.body.collegeCode;
    let email = req.body.email;
    let mobileNumber = req.body.mobileNumber;
    const collegeId = req.body.collegeId;

    //Creating account in db
    let response;
    try {
        const userName = email.split('@')[0];
        const userId = uuidv4();
        response = await usersCollection.create({
            role: 'customer',
            firstName: userName,
            lastName: '',
            email: email,
            mobileNumber,
            collegeCode: collegeId,
            profileImage: `https://api.dicebear.com/9.x/initials/svg?seed=${userName}`,
            userId,
        });
    } catch (error) {
        console.log(
            'Error occured while creating account during saving customSignupDetails : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Unable to create account.Please try again later.',
        });
    }

    //Preparing payload for JWT token for login
    const payload = {
        email: email.toLowerCase().trim(),
        id: response._id,
        role: response.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1y',
    });

    return res.status(200).json({
        success: true,
        easerSecurityTicket: token,
        profileImage: response.profileImage,
        message: 'Account is successfully Created',
    });
}

//POST REQUEST
async function saveGoogleSignupAllDetailsController(req, res) {
    let { googleId, collegeCode, mobileNumber } = req.body;

    //Checking whether token is given or not
    if (!googleId) {
        return res.status(400).json({
            success: false,
            message: 'GoogleId is required',
        });
    }

    //Checking whether college-code is given or not
    if (!collegeCode) {
        return res.status(400).json({
            success: false,
            message: 'College is required.',
        });
    }

    //Checking whether mobile number is given or not
    if (!mobileNumber) {
        return res.status(400).json({
            success: false,
            message: 'Mobile number is required.',
        });
    }

    //validate the mobileNumber

    //Removing leading and trailing spaces.
    mobileNumber = mobileNumber.trim();

    const numberRegex = /^[6-9]\d{9}$/;
    if (!numberRegex.test(mobileNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number entered.',
        });
    }

    let email;
    let f_name;
    let l_name;
    let picture;

    try {
        const response = await googleSignupTemp.findOne({ id: googleId });

        if (!response) {
            console.log(
                'Error while saving the google signup details to the database : [ERROR message : Your session has expired. Please sign up again.]',
                response
            );
            return res.status(400).json({
                success: false,
                message: 'Your session has expired. Please sign up again.',
            });
        }

        ((email = response.email),
            (f_name = response.firstName),
            (l_name = response.lastName ? response.lastName : ''),
            (picture = response.picture));
    } catch (e) {
        console.log(
            'Error occured while fetching data from the googleTemp collections during saveGoogleSingupDetails : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    // try
    // {
    //     const isEmailAlreadyExists = await usersCollection.findOne({email});

    //     if(isEmailAlreadyExists)
    //     {
    //         return res.status(409).json({
    //             success : false,
    //             message : "Email is already registered."
    //         })

    //     }
    // }
    // catch(error)
    // {
    //     console.log("Error occured while validating email of user during saveGoogleSingupDetails : ",error);
    //     res.status(500).json({
    //         success : false,
    //         message : error.message
    //     })
    // }

    // Validate the collegeCode
    let isCollegeValid;
    try {
        if (!FrequentlyUsedCollegeCodes_Cache.has(collegeCode)) {
            isCollegeValid = await registeredColleges.findOne({
                collegeCode: collegeCode,
            });

            if (!isCollegeValid) {
                return res.status(409).json({
                    success: false,
                    message:
                        'This college is not registered with our services.',
                });
            }

            FrequentlyUsedCollegeCodes_Cache.set(
                collegeCode,
                isCollegeValid._id,
                60 * 60
            );
        } else {
            isCollegeValid = {
                _id: FrequentlyUsedCollegeCodes_Cache.get(collegeCode),
            };
        }
    } catch (error) {
        console.log(
            'Error occured while validating college code of user during saving googleSignupDetails : ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    let response;
    try {
        const userId = uuidv4();
        response = await usersCollection.create({
            role: 'customer',
            firstName: f_name,
            lastName: l_name,
            email,
            mobileNumber,
            collegeCode: isCollegeValid._id,
            profileImage: picture
                ? picture
                : `https://api.dicebear.com/9.x/initials/svg?seed=${f_name} ${l_name}`,
            userId,
        });
    } catch (error) {
        console.log(
            'Error occured while creating account during saving googleSignupDetails : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Unable to create account.Please try again later.',
        });
    }

    //Preparing payload for JWT token for login
    const payload = {
        email: email,
        id: response._id,
        role: response.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1y',
    });

    return res.status(200).json({
        success: true,
        easerSecurityTicket: token,
        profileImage: response.profileImage,
        message: 'Account is successfully Created',
    });
}

module.exports = {
    saveCustomSignupDetailsController,
    saveGoogleSignupAllDetailsController,
    preCustomSignupCheckController,
    googlePreSignupCheckController,
};

//<-------------------------------------------------FOR VENDOR AUTHENTICATION----------------------------------->
