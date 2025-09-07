const usersCollection = require('../../models/Users.js');
const mailSender = require('../../utils/mailSender');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function resetPasswordToken(req, res) {
    try {
        const email = req.body.email;

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Please enter your email address',
            });
        }

        // Validate email format using a regular expression
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format.',
            });
        }

        const user = await usersCollection.findOne({
            email: email,
            role: 'vendor',
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: `This email is not registered with us.`,
            });
        }
        const token = crypto.randomBytes(20).toString('hex');

        const updatedDetails = await usersCollection.findOneAndUpdate(
            { email: email },
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000,
            },
            { new: true }
        );

        const url = `https://www.easer.co.in/update-password/${token}`;

        mailSender(
            email,
            'Password Reset',
            `
				<h2>Password Reset</h2>
				<p>To reset your password, please click the link below:</p>
				<a href="${url}" style="color: #3498db; text-decoration: none;">Reset Your Password</a>
				<p>If you did not request this, please ignore this email.</p>
				<p>Thank you,<br>Your Team</p>
			`
        );

        res.json({
            success: true,
            message:
                'Email sent successfully ,please check your email to continue further',
            email: email,
        });
    } catch (error) {
        console.log(
            'Error occured while sending the reset password token : ',
            error
        );
        return res.status(500).json({
            error: error.message,
            success: false,
            message: `Error occured while updating the password`,
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { password, confirmPassword, token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required',
            });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are mandatory',
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be atleast 8 characters long.',
            });
        }

        if (password.includes(' ')) {
            return res.status(400).json({
                success: false,
                message: 'Password should not contain spaces.',
            });
        }

        // Validate that confirmPassword matches password
        if (password !== confirmPassword) {
            return res.status(409).json({
                success: false,
                message: 'Passwords do not match.',
            });
        }

        const userDetails = await usersCollection.findOne({ token: token });
        if (!userDetails) {
            return res.status(500).json({
                success: false,
                message: 'Link is Invalid',
            });
        }

        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(403).json({
                success: false,
                message: `Link is expired, Please regenerate another link.`,
            });
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        await usersCollection.findOneAndUpdate(
            { token: token },
            {
                password: encryptedPassword,
                token: null,
                resetPasswordExpires: null,
            },
            { new: true }
        );
        res.json({
            success: true,
            message: `Password reset successful`,
        });
    } catch (error) {
        console.log(
            'Error occured while reseting the password at forget password : ',
            error
        );
        return res.status(500).json({
            error: error.message,
            success: false,
            message: `Error occured while updating the password`,
        });
    }
}

module.exports = {
    resetPasswordToken,
    resetPassword,
};
