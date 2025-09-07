const OTPTemplate = (otp) => {
    return `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.1); border-radius: 8px;">
            <h2 style="text-align: center; color: #14213d;">Email Verification by Easer</h2>
            <p style="font-size: 16px; color: #333333;">Hello User,</p>
            <p style="font-size: 16px; color: #333333;">This is your OTP for email verification:</p>
            
            <p style="font-size: 20px; font-weight: bold; color: #3498db; padding: 10px 20px; background-color: #e6f7ff; border-radius: 5px; text-align: center;">
                ${otp}
            </p>

            <p style="font-size: 16px; color: #333333;">Please enter this OTP on the verification page to complete the process.</p>
            
            <p style="font-size: 14px; color: #999999; margin-top: 20px;">For your security, this OTP will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>

            <p style="font-size: 16px; color: #333333;">Thank you,</p>
            <p style="font-size: 16px; color: #333333;">The Easer Team</p>
    </div>`;
};

const getInTouchTemplate = (
    firstName,
    lastName,
    email,
    mobileNumber,
    message
) => {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">
                <h2 style="color: #333;">New Contact Form Submission</h2>
                <p style="font-size: 16px; color: #555;">
                    <strong>Name:</strong> ${firstName} ${lastName}<br />
                    <strong>Mobile Number:</strong> ${mobileNumber}<br />
                    <strong>Email:</strong> ${email}<br />
                    <strong>Message:</strong>
                </p>
                <blockquote style="background: #f0f0f0; border-left: 5px solid #007bff; padding: 10px; margin: 20px 0; font-style: italic;">
                    ${message}
                </blockquote>
                <footer style="font-size: 12px; color: #777;">
                    <p>This message was sent from the contact form on your website.</p>
                </footer>
            </div>
            `;
};

module.exports = { OTPTemplate, getInTouchTemplate };
