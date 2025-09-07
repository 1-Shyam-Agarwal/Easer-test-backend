const userInfo = require('../../models/Users.js');
const vendorAdditionalDetails = require('../../models/VendorExtraDetails.js');
const bcrypt = require('bcrypt');
const { Mutex } = require('async-mutex');
const mutex = new Mutex();

exports.validateAndUpdateName = async (req, res) => {
    const release = await mutex.acquire();
    try {
        //extracting the firstName and lastName from the body
        const { firstName } = req.body;
        let lastName = req.body.lastName;
        let { id } = req.tokenPayload;

        if (!lastName) {
            lastName = '';
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User is missing',
            });
        }
        //validate the body : firstname is must and lastname is optional and firstName and lastName should be alphabets only of specific size
        if (!firstName) {
            return res.status(400).json({
                success: false,
                message: 'First Name is mandatory',
            });
        }

        if (!(typeof lastName === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'lastName is not a string.',
            });
        }

        if (!(typeof firstName === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Firstname is not a string.',
            });
        }

        // Validate length (maximum 50 characters)
        if (!(firstName.length >= 1 && firstName.length <= 50)) {
            return res.status(400).json({
                success: false,
                message: 'First name must be between 1 and 50 characters long.',
            });
        }

        // Validate that firstName contains only alphabetic characters
        const regex = /^[A-Za-z]+$/;
        if (!regex.test(firstName)) {
            return res.status(400).json({
                success: false,
                message: 'First name can only contain alphabetic characters.',
            });
        }

        // Validate length (maximum 20 characters)
        if (lastName.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Last name must be between 1 and 50 characters long.',
            });
        }
        const Lastregex = /^[A-Za-z]*$/;

        // Validate that lastName contains only alphabetic characters
        if (!Lastregex.test(lastName)) {
            return res.status(400).json({
                success: false,
                message: 'Last Name can only contain alphabetic characters.',
            });
        }

        //update the value and update profileImage
        const response = await userInfo.findByIdAndUpdate(
            id, // The `userId` as the document ID
            {
                firstName: firstName.toLowerCase(), // Converts the first name to lowercase
                lastName: lastName.toLowerCase(), // Converts the last name to lowercase
            }, // The fields to update
            { new: true } // Options to return the updated document
        );

        if (!response) {
            return res.status(400).json({
                success: false,
                message: "Such user doesn't exist.",
            });
        }

        // return message
        return res.status(200).json({
            success: true,
            message: 'Name is updated successfully',
            data: {
                firstName: response.firstName,
                lastName: response.lastName,
            },
        });
    } catch (error) {
        console.log('Error occured while changing the name : ', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    } finally {
        release();
    }
};

exports.validateAndUpdatePassword = async (req, res) => {
    try {
        //extracting data from the body
        const { currentPassword, newPassword } = req.body;
        const userId = req.tokenPayload.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Userid that you want to update is missing',
            });
        }

        //validating the data -> 1) no one should be empty 2)current password is correct or not 3)new password is in correct format or not
        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your current Password',
            });
        }

        if (!(typeof currentPassword === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Current password is not a string',
            });
        }

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your New Password',
            });
        }

        if (!(typeof newPassword === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'New password is not a string',
            });
        }

        const user = await userInfo.findOne({ _id: userId });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid id',
            });
        }

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({
                success: false,
                message: 'You have entered the wrong current password.',
            });
        }

        // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // if (!passwordRegex.test(newPassword)) {
        //     return res.status(400).json({
        //         success : false,
        //         message: "Password must contain at least one lowercase letter, one uppercase letter, one number, one special character, and must be greater than or eqaul to 8 characters long." });
        // }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be atleast 8 characters long.',
            });
        }

        if (newPassword.includes(' ')) {
            return res.status(400).json({
                success: false,
                message: 'New password should not contain spaces.',
            });
        }
        // encrypt the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update the password

        const response = await userInfo.findByIdAndUpdate(
            userId,
            {
                password: hashedPassword,
            },
            {
                new: true,
            }
        );
        //return the response
        res.status(200).json({
            success: true,
            message: 'Password is successfully changed',
        });
    } catch (error) {
        console.log('Error occured while changing the password : ', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.changeMobileNumber = async (req, res) => {
    const release = await mutex.acquire();
    try {
        const { mobileNumber } = req.body;
        const { id } = req.tokenPayload;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Id is missing.',
            });
        }

        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is missing.',
            });
        }

        if (!(typeof mobileNumber === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is not a string.',
            });
        }

        const numberRegex = /^[0-9]{10}$/;
        if (!numberRegex.test(mobileNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Mobile Number Entered.',
            });
        }

        const response = await userInfo.findByIdAndUpdate(
            id,
            {
                mobileNumber: mobileNumber,
            },
            { new: true }
        );

        if (!response) {
            return res.status(400).json({
                success: false,
                message: "Such user doesn't exist.",
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Mobile number is updated successfully.',
        });
    } catch (error) {
        console.log('Error occured while changing the mobile number : ', error);
        return res.status(500).json({
            succcess: false,
            message: 'Internal server problem.',
        });
    } finally {
        release();
    }
};

