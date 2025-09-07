const mailSender = require('../utils/mailSender');
const { getInTouchTemplate } = require('../MailTemplates.js');

exports.getInTouch = async (req, res) => {
    try {
        //fetching information from the request
        const { firstName, email, mobileNumber, countryCode, message } =
            req.body;

        let lastName = req.body.lastName ? req.body.lastName : '';

        // vlaidtion
        //Non-Empty Validation
        if (!firstName || !email || !mobileNumber || !countryCode || !message) {
            return res.status(400).json({
                success: false,
                message:
                    'All fields are mandatory except lastname. Kindly fill all.',
            });
        }
        //should be in correct format

        // First Name Format Validation
        const namePattern = /^.{1,100}$/; // length between 1 and 100
        if (!namePattern.test(firstName)) {
            return res.status(400).json({
                success: false,
                message: 'First name should be of length between 1 to 100',
            });
        }

        // Last Name Format Validation
        const lastNamePattern = /^.{0,100}$/;
        if (!lastNamePattern.test(lastName)) {
            return res.status(400).json({
                success: false,
                message: 'Last name should be of atmost 100 characters long.',
            });
        }

        // Email Format Validation
        const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Mobile Number Format Validation
        const mobilePattern = /^[0-9]{8,15}$/; // Adjust the length as needed (for example, 8 to 15 digits)
        if (!mobilePattern.test(mobileNumber)) {
            return res.status(400).json({
                success: false,
                message:
                    'Mobile number must be 8 to 15 digits long and contain digits only.',
            });
        }

        //message validation
        const messagePattern = /^.{1,1000}$/; // length between 1 and 1000
        if (!messagePattern.test(message)) {
            return res.status(400).json({
                success: false,
                message: 'Message should be of length between 1 to 1000',
            });
        }

        //send mail
        const response = mailSender(
            'easer.helpdesk.india@gmail.com',
            'GET IN TOUCH MESSAGE',
            getInTouchTemplate(
                firstName,
                lastName,
                email,
                mobileNumber,
                message
            )
        )
            .then(() => {
                console.log(
                    "Get In touch message is sent successfully to the company's mail."
                );
            })
            .catch((error) => {
                console.log(
                    "Get In touch message is not sent successfully to the company's mail due to some error."
                );
                console.log('Details of the contact is : ');
                console.log('FirstName : ', firstName);
                console.log('LastName : ', lastName);
                console.log('Email : ', email);
                console.log('CountryCode : ', countryCode);
                console.log('MobileNumber : ', mobileNumber);
                console.log('Message : ', message);
            });

        //successful message
        return res.status(200).json({
            success: true,
            message: 'Message sent successfully',
        });
    } catch (error) {
        console.log(
            'Error occured while sending the message through GetinTouch form : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'ERROR OCCURED',
            error: error.message,
        });
    }
};
