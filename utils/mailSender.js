const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
    try {
        // Create a transporter using environment variables
        let transporter = nodemailer.createTransport({
            service: 'gmail', // Gmail, etc.
            auth: {
                user: process.env.MAIL_USER, // Your email
                pass: process.env.MAIL_PASS, // Your app password
            },
        });

        // Define email options
        let info = transporter.sendMail({
            from: `"Easer - Making life peaceful and serene." <${process.env.MAIL_USER}>`, // Sender's name and email address
            to: email, // Recipient's email
            subject: title, // Subject line
            html: body, // Email body in HTML format
        });
    } catch (error) {
        console.error('Error while sending email:', error.message);
        return error.message;
    }
};

module.exports = mailSender;
