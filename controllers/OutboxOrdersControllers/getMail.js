const usersCollection = require('../../models/Users.js');
const mails = require('../../models/Mails.js');
const { populate } = require('../../models/RegisteredColleges.js');
//Cronjob , mail , modification , deletion  ,open in different modes. ,getMail

//Convert special character to respective escape character
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getCustomerMails(req, res) {
    const { role, id } = req.tokenPayload;

    const temp = parseInt(req.query.page);
    const page = isNaN(temp) ? 1 : temp; // Get the page number from query parameters, default to 1

    //Checking whether the role and id is present or not
    if (!id || !role) {
        return res.status(400).json({
            success: false,
            message: 'Id or Role is missing.',
        });
    }

    //Validating the role
    if (!['customer', 'vendor', 'admin'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Role',
        });
    }

    const limit = 25; //Number of mails to fetch per page
    const skip = (page - 1) * limit; //Calculate the number of mails to skip based on the page number

    //Validating the id whether it is correct or not
    let mailsData;
    let totalMails;
    try {
        userData = await usersCollection.findOne({ _id: id, role: 'customer' });

        // If user not found, return an error
        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such user doesn't exists.`,
            });
        }

        //Fetch mails count
        totalMails = await mails.countDocuments({ sender: id });

        // Fetch mails with pagination
        mailsData = await mails
            .find({ sender: id })
            .skip(skip)
            .limit(limit)
            .select('-_id')
            .sort({ timeStamp: -1 })
            .populate([
                {
                    path: 'sender',
                    select: '-_id firstName lastName',
                },
                {
                    path: 'receiver',
                    select: '-_id vendorAdditionalDetails',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark ',
                    },
                },
            ])
            .lean();

        // Remove the _id field from each document in the documents array
        // This is done to avoid sending unnecessary data to the frontend and for security reasons
        mailsData.forEach((mail) => {
            if (Array.isArray(mail.documents)) {
                mail.documents = mail.documents.map((doc) => {
                    const { _id, ...rest } = doc;
                    return rest;
                });
            }
        });
    } catch (error) {
        console.log(
            'Error occured while fetching customer mails to the customer dashboard : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Mails is fetched successfully.',
        data: mailsData,
        page: page,
        totalMails: totalMails,
        totalPages: Math.ceil(totalMails / limit), // Calculate total pages
    });
}

// Function to get mails for the vendor
// It will be used in the EaserInboxPage.jsx
async function getVendorMails(req, res) {
    // Extracting the role and id from the token payload
    const { role, id } = req.tokenPayload;

    const temp = parseInt(req.query.page);
    const page = isNaN(temp) ? 1 : temp; // Get the page number from query parameters, default to 1

    //Checking whether the role and id is present or not
    if (!id || !role) {
        return res.status(400).json({
            success: false,
            message: 'Id or Role is missing.',
        });
    }

    //Validating the role
    if (!['customer', 'vendor', 'admin'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Role',
        });
    }

    const limit = 25; // Number of mails to fetch per page
    const skip = (page - 1) * limit; // Calculate the number of mails to skip based on the page number

    //Validating the id whether it is correct or not
    let mailsData;
    let totalMails;
    try {
        const userData = await usersCollection.findOne({
            _id: id,
            role: 'vendor',
        });

        // If user not found, return an error
        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such user doesn't exists.`,
            });
        }

        //Fetch mails count
        totalMails = await mails.countDocuments({ receiver: id });

        // Fetch mails with pagination
        mailsData = await mails
            .find({ receiver: id })
            .select('-_id -receiver')
            .skip(skip)
            .limit(limit)
            .sort({ timeStamp: -1 })
            .populate({
                path: 'sender',
                select: '-_id firstName lastName mobileNumber email ',
            })
            .lean();

        // Remove the _id field from each document in the documents array
        // This is done to avoid sending unnecessary data to the frontend and for security reasons
        mailsData.forEach((mail) => {
            if (Array.isArray(mail.documents)) {
                mail.documents = mail.documents.map((doc) => {
                    const { _id, ...rest } = doc;
                    return rest;
                });
            }
        });
    } catch (error) {
        console.log(
            'Error occured while fetching customer mails to the customer dashboard : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Mails is fetched successfully.',
        data: mailsData,
        page: page,
        totalMails: totalMails,
        totalPages: Math.ceil(totalMails / limit), // Calculate total pages
    });
}

// Function to get filtered mails based on a keyword
async function getFilteredMailsByFileName(req, res) {
    const { role, id } = req.tokenPayload;

    //Checking whether the role and id is present or not
    if (!id || !role) {
        return res.status(400).json({
            success: false,
            message: 'Id or Role is missing.',
        });
    }

    //Validating the role
    if (!['customer', 'vendor', 'admin'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Role',
        });
    }

    // fetching the keyword from query parameters
    const fileName = req.query.fileName;

    // Validating the keyword
    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Filename is invalid.',
        });
    }

    //Pagination
    const limit = 25; // Number of mails to fetch per page

    const temp = parseInt(req.query.page);
    const page = isNaN(temp) ? 1 : temp;

    // Get the page number from query parameters, default to 1
    const skip = (page - 1) * limit; // Calculate the number of mails to skip based on the page number
    let filteredMails;
    let totalCount;
    try {
        const userData = await usersCollection.findOne({ _id: id });

        // If user not found, return an error
        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such user doesn't exists.`,
            });
        }

        const escapedFileName = escapeRegex(fileName);
        const query = {
            sender: id,
            documents: {
                $elemMatch: {
                    fileName: { $regex: `${escapedFileName}`, $options: 'i' }, // Case-insensitive partial match
                },
            },
        };

        // Step 1: Get total count (without skip & limit)
        totalCount = await mails.countDocuments(query);

        // Fetch mails with pagination and filter by fileName
        // Using $elemMatch to filter documents array based on fileName
        filteredMails = await mails
            .find({
                sender: id,
                documents: {
                    $elemMatch: {
                        fileName: {
                            $regex: `${escapedFileName}`,
                            $options: 'i',
                        }, // case-insensitive match
                    },
                },
            })
            .skip(skip)
            .limit(limit)
            .select('-_id')
            .sort({ timeStamp: -1 })
            .populate([
                {
                    path: 'sender',
                    select: '-_id firstName lastName',
                },
                {
                    path: 'receiver',
                    select: '-_id vendorAdditionalDetails',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark ',
                    },
                },
            ])
            .lean();

        // Remove the _id field from each document in the documents array
        // This is done to avoid sending unnecessary data to the frontend and for security reasons
        filteredMails.forEach((mail) => {
            if (Array.isArray(mail.documents)) {
                mail.documents = mail.documents.map((doc) => {
                    const { _id, ...rest } = doc;
                    return rest;
                });
            }
        });
    } catch (error) {
        console.log(
            'Error occured while fetching filtered mails on the basis of filename : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Filtered mails fetched successfully.',
        data: filteredMails,
        page: page,
        totalMails: totalCount,
        totalPages: Math.ceil(totalCount / limit), // Calculate total pages
    });
}

// Function to get specific mail details by mailId
async function getSpecificMailDetails(req, res) {
    const { mailId } = req.params; // Extracting mailId from request parameters

    if (!mailId) {
        return res.status(400).json({
            success: false,
            message: 'Mail ID is required.',
        });
    }

    let specificMailDetails;
    try {
        // Fetching specific mail details using mailId
        // Using findOne to get the mail with the specific mailId
        specificMailDetails = await mails
            .findOne({ mail_id: mailId })
            .select('-_id')
            .populate([
                {
                    path: 'sender',
                    select: '-_id firstName lastName email mobileNumber',
                },
                {
                    path: 'receiver',
                    select: '-_id vendorAdditionalDetails',
                    populate: {
                        path: 'vendorAdditionalDetails',
                        select: '-_id shopName shopLandMark ',
                    },
                },
            ])
            .lean();

        // If no mail found with the given mailId, return 404
        if (!specificMailDetails) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found.',
            });
        }

        if (Array.isArray(specificMailDetails.documents)) {
            specificMailDetails.documents = specificMailDetails.documents.map(
                (doc) => {
                    const { _id, ...rest } = doc;
                    return rest;
                }
            );
        }
    } catch (error) {
        console.log(
            'Error occured while fetching specific mail details : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Specific mail details fetched successfully.',
        data: specificMailDetails,
    });
}

// Function to get filtered mails by customer name
async function getFilteredMailsByCustomerName(req, res) {
    const { role, id } = req.tokenPayload;

    //Checking whether the role and id is present or not
    if (!id || !role) {
        return res.status(400).json({
            success: false,
            message: 'Id or Role is missing.',
        });
    }

    //Validating the role
    if (!['customer', 'vendor', 'admin'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Role',
        });
    }

    // fetching the keyword from query parameters
    const customerName = req.query.customerName;

    // Validating the keyword
    if (
        !customerName ||
        typeof customerName !== 'string' ||
        customerName.trim() === ''
    ) {
        return res.status(400).json({
            success: false,
            message: 'customername is invalid.',
        });
    }

    //Pagination
    const limit = 25; // Number of mails to fetch per page

    const temp = parseInt(req.query.page);
    const page = isNaN(temp) ? 1 : temp; // Get the page number from query parameters, default to 1

    const skip = (page - 1) * limit; // Calculate the number of mails to skip based on the page number

    let paginatedMails;
    let totalCount;
    try {
        // Validating the id whether it is correct or not
        const userData = await usersCollection.findOne({ _id: id });

        // If user not found, return an error
        if (!userData) {
            return res.status(400).json({
                success: false,
                message: `Such user doesn't exists.`,
            });
        }

        //Base query
        const query = { receiver: id };

        // Fetch all matching mails with required population (no pagination yet)
        let allMails = await mails
            .find(query)
            .sort({ timeStamp: -1 })
            .select('-_id -receiver')
            .populate([
                {
                    path: 'sender',
                    select: '-_id firstName lastName email mobileNumber',
                },
            ])
            .lean();

        // 3. Filter by customerName if needed
        const escapedCustomerName = escapeRegex(customerName);
        if (escapedCustomerName) {
            const regex = new RegExp(escapedCustomerName, 'i');
            allMails = allMails.filter((mail) => {
                if (!mail.sender) return false;
                const fullName = `${mail.sender.firstName} ${mail.sender.lastName}`;
                return regex.test(fullName);
            });
        }

        // Accurate totalCount after applying all filters
        totalCount = allMails.length;

        // 4. Paginate after filtering
        paginatedMails = allMails.slice(skip, skip + limit);

        // 5. Remove _id from documents array
        paginatedMails.forEach((mail) => {
            if (Array.isArray(mail.documents)) {
                mail.documents = mail.documents.map((doc) => {
                    const { _id, ...rest } = doc;
                    return rest;
                });
            }
        });
    } catch (error) {
        console.log(
            'Error occured while fetching filtered mails on the basis of customer name : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error.',
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Filtered mails fetched successfully.',
        data: paginatedMails,
        page: page,
        totalMails: totalCount,
        totalPages: Math.ceil(totalCount / limit), // Calculate total pages
    });
}

module.exports = {
    getCustomerMails,
    getVendorMails,
    getFilteredMailsByFileName,
    getSpecificMailDetails,
    getFilteredMailsByCustomerName,
};
