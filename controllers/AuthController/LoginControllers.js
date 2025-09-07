const usersCollection = require('../../models/Users.js');
const bcrypt = require('bcrypt');

//Used for creating session
const jwt = require('jsonwebtoken');

//used for creating unique id for user
const { v4: uuidv4 } = require('uuid');

const oauth2Client = require('../../utils/googleClients.js');
const axios = require('axios');

//<---------------------------------------------PreLoginChecks-------------------------------------->

//GET REQUEST USING PARAMS
//USED TO CHECK WHETHER THE ENTERED EMAIL IS ALREADY REGISTERED OR NOT
async function preCustomLoginCheckController(req, res, next) {
    //Extracting information from the request body
    let email = req.params.email;

    //Validating the email
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required',
        });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format.',
        });
    }

    //checking for existing email
    let userData;
    try {
        const isEmailAlreadyExists = await usersCollection.findOne({ email });

        if (!isEmailAlreadyExists) {
            return res.status(409).json({
                success: false,
                message: 'Email is not registered.',
            });
        }

        userData = isEmailAlreadyExists;
    } catch (error) {
        console.log(
            'Error occured while validating email of user during preCustomLoginCheck: ',
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

    //If role is customer then send the otp else take password.
    const role = userData?.role;
    if (role === 'customer') {
        return next();
    }

    return res.status(200).json({
        success: true,
        message: 'Email validated successfully',
        data: {
            role,
            email,
        },
    });
}

//Login with Google : Pre-checks (if user is customer : login otherwise move to admin/vendor password section.)
//GET REQUEST
async function googlePreLoginCheckController(req, res) {
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
    const { email } = googleRes.data;

    let userData;
    try {
        const isEmailAlreadyExists = await usersCollection.findOne({ email });

        if (!isEmailAlreadyExists) {
            return res.status(409).json({
                success: false,
                message: 'Email is not registered.',
            });
        }

        userData = isEmailAlreadyExists;
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

    if (userData?.role == 'customer') {
        //Preparing payload for JWT token for login
        const payload = {
            email: userData.email,
            id: userData._id,
            role: userData.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1y',
        });

        return res.status(200).json({
            success: true,
            easerSecurityTicket: token,
            profileImage: userData.profileImage,
            message: 'Account is successfully Created',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Email validated successfully',
        data: {
            role: userData.role,
            email,
        },
    });
}

//<---------------------------------------------Verify Credentials------------------------------------>

// NOTE : This controller is specifically for vendor and admins for more secure logins.
//POST REQUEST
async function checkLoginPasswordController(req, res) {
    // Get email and password from request body
    const { email, password } = req.body;

    // Check if email is missing or not
    if (!email) {
        return res.status(400).json({
            success: false,
            message: `Email is required.`,
        });
    }

    // Validate email format using a regular expression
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format.',
        });
    }

    // Check if password is missing or not
    if (!password) {
        return res.status(400).json({
            success: false,
            message: `Password is required.`,
        });
    }

    //Validating the password
    if (password.includes(' ')) {
        return res.status(400).json({
            success: false,
            message:
                'Your entered password may be containing leading and trailing spaces.',
        });
    }

    // Finding whether there exists any user with provided email
    let user;
    try {
        user = await usersCollection
            .findOne({ email: email.toLowerCase().trim() })
            .select('profileImage role password');

        if (!user) {
            return res.status(409).json({
                success: false,
                message: `Email is not registered.`,
            });
        }
    } catch (error) {
        console.log(
            'Error occured while validating email at checking login password : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }

    //If user?.password is undefined which means it is a customer who is accessing this api as password field is not present in the customer document.
    if (!user?.password) {
        return res.status(400).json({
            success: false,
            message: "Customer can't use password authentication.",
        });
    }

    // Generate JWT token and Compare Password
    if (await bcrypt.compare(password, user?.password)) {
        //Preparing payload for the JWT token
        const payload = {
            email: email.toLowerCase().trim(),
            id: user._id,
            role: user.role,
        };

        //Preparing JWT Token for authenication and authorization
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1y',
        });

        return res.status(200).json({
            success: true,
            easerSecurityTicket: token,
            profileImage: user.profileImage,
        });
    } else {
        return res.status(401).json({
            success: false,
            message: `Password is incorrect`,
        });
    }
}

module.exports = {
    preCustomLoginCheckController,
    googlePreLoginCheckController,
    checkLoginPasswordController,
};
