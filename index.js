const express = require('express');
require('dotenv').config();
const dbconnect = require('./config/database.js');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const {
    deleteInconsistentFiles,
} = require('./Cronjobs/DeleteInconsistentFiles.js');

//Setting up the server
const App = express();

const portNo = process.env.PORT || 4000;

App.listen(portNo, () => {
    console.log(`The server is active at ${portNo}`);
});

// Enable CORS for all routes
const corsOption = {
    origin: [
        'http://localhost:3000',
        'https://easer.co.in',
        'https://www.easer.co.in',
    ],
    credentials: true,
};

App.use(cors(corsOption));

//Connecting Server with the Database
dbconnect();

App.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp/',
    })
);

App.use(express.json());

//Defining Routing for the server
const adminRouters = require('./routers/AdminRouters.js');
const authRouters = require('./routers/AuthRouters.js');
const generalRouters = require('./routers/GeneralRouters.js');
const getInformationRouters = require('./routers/GetInformationRouters.js');
const inboxOrdersRouters = require('./routers/OutboxOrdersRouters.js');
const paymentGatewayRouters = require('./routers/PaymentGatewayRouters.js');
const prepaidOrdersRouters = require('./routers/PrepaidOrdersRouters.js');
const resetDetailsRouters = require('./routers/ResetDetailsRouters.js');

// App.use('/api/v1' , AdminRouters);
App.use('/api/v1', authRouters);
App.use('/api/v1', generalRouters);
App.use('/api/v1', getInformationRouters);
App.use('/api/v1', inboxOrdersRouters);
App.use('/api/v1', paymentGatewayRouters);
App.use('/api/v1', prepaidOrdersRouters);
App.use('/api/v1', resetDetailsRouters);
