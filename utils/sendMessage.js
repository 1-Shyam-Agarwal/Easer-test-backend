const plivo = require('plivo');
require('dotenv').config();

exports.sendMessage = async (phoneNumber, message) => {
    auth_plivo_id = process.env.AUTH_PLIVO_ID;
    auth_plivo_token = process.env.AUTH_PLIVO_TOKEN;

    try {
        let client = new plivo.Client(auth_plivo_id, auth_plivo_token);
        const response = await client.messages.create({
            src: '+919311161298',
            dst: `+91${phoneNumber}`,
            text: message,
        });

        console.log('Message sent successfully:', response);
    } catch (error) {
        console.log('Error occured while sending the message : ', error);
    }
};
