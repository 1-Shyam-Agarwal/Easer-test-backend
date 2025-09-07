const mongoose = require('mongoose');
require('dotenv').config();

async function dbconnect() {
    const response = await mongoose
        .connect(process.env.DATABASE_URL)
        .then(() => {
            console.log('Database is successfully connected with server');
        })
        .catch((err) => {
            console.log('Database is unable to connect with the server');
            console.error(err.message);
            process.exit(1);
        });
}

module.exports = dbconnect;
