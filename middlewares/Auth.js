const jwt = require('jsonwebtoken');
require('dotenv').config();
const usersCollection = require('../models/Users.js');

exports.auth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({
            success: 'false',
            message: 'Unauthorised Access',
        });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: true,
            message: 'Token is missing',
        });
    }

    //verify token
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);

        req.tokenPayload = payload;
        
    } catch (error) {
        console.log('Error occured while authenicating the user : ', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid Token.',
        });
    }

    try
    {
        const response = await usersCollection.findOne({_id : payload.id});

        let n = response.sessions.length;
        let flag = false;

        for(let i =0 ; i<n ; i++)
        {
            if(response.sessions[i].token === token)
            {
                flag = true;
                break;
            }
        }

        if(flag) next();
        else
        {
            return res.status(401).json({
                success: false,
                message : "Such token doesn't exist."
            })
        }

    }catch(e)
    {
        console.log("Error occured in auth middleware while checking whether the given token exists in db or not : " , e);
        return res.status(500).json({
            success: false,
            message : "Internal Server Error."
        })
    }
};


exports.isCustomer = async (req, res, next) => {
    try {
        const role = req.tokenPayload.role;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is Missing',
            });
        }

        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
            });
        }

        if (role === 'customer') {
            return next();
        }

        return res.status(400).json({
            success: false,
            message: 'Only Customer can access this feature',
        });
    } catch (error) {
        console.log(
            'Error occured while checking whether the user is user or not: ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            role,
        });
    }
};


exports.isVendor = async (req, res, next) => {
    try {
        const role = req.tokenPayload.role;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is Missing',
            });
        }

        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
            });
        }

        if (role === 'vendor') {
            return next();
        }

        return res.status(400).json({
            success: false,
            message: 'Only Vendor can access this feature',
        });
    } catch (error) {
        console.log(
            'Error occured while checking whether the user is vendor or not: ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }
};


exports.isAdmin = async (req, res, next) => {
    try {
        const role = req.tokenPayload.role;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is Missing',
            });
        }

        if (!['customer', 'vendor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
            });
        }

        if (role === 'admin') {
            return next();
        }

        return res.status(400).json({
            success: false,
            message: 'Only Admin can access this feature',
        });
    } catch (error) {
        console.log(
            'Error occured while checking whether the user is admin or not: ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }
};




