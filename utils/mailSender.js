const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
    try {
        // Create a transporter using environment variables
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER, // Your email
                pass: process.env.MAIL_PASS, // Your app password
            },
            // Add timeout configurations
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });

        // Verify connection configuration
        await transporter.verify();
        console.log('SMTP server connection verified');

        // Define email options - await the sendMail call
        let info = await transporter.sendMail({
            from: `"Easer - Making life peaceful and serene." <${process.env.MAIL_USER}>`,
            to: email,
            subject: title,
            html: body,
        });

        console.log('Email sent successfully:', info.messageId);
        return info;

    } catch (error) {
        console.error('Error while sending email:', error.message);
        throw error; // Instead of returning error.message, throw it
    }
};

module.exports = mailSender;