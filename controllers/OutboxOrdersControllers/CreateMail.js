const Mail = require('../../models/Mails.js');
const usersCollection = require('../../models/Users.js');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

async function createMail(req, res) {
    const { vendor, documents } = req.body;

    const customerId = req.tokenPayload.id;

    //After proper validation;
    if (!customerId) {
        return res.status(400).json({
            success: false,
            message: 'Sender Id is required.',
        });
    }

    if (!vendor) {
        return res.status(400).json({
            success: false,
            message: 'Reciever Id is required.',
        });
    }

    if (!documents || documents.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Documents are required.',
        });
    }

    let totalFiles = 0;
    for (let file of documents) {
        if (typeof file === 'object') {
            if (Object.keys(file).length === 5) {
                if (
                    !(
                        'fileName' in file &&
                        'fileSize' in file &&
                        'fileRef' in file &&
                        'fileType' in file &&
                        'fileUrl' in file
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Document doesn't contain required fields.",
                    });
                }

                let fileSize = parseFloat(file.fileSize);
                let maxFileSize = parseFloat(process.env.MAX_FILE_SIZE);

                let fileSizeInMb = fileSize / (1024 * 1024);

                if (fileSizeInMb > maxFileSize) {
                    return res.status(400).json({
                        success: false,
                        message: `${file.fileName} exceeds ${process.env.MAX_FILE_SIZE}Mb limit.`,
                    });
                }

                totalFiles += 1;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Document should have length equal to 5',
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Document should be object',
            });
        }
    }

    if (totalFiles > process.env.MAX_FILES) {
        return res.status(400).json({
            success: false,
            message: `Only ${process.env.MAX_FILES} files are allowed.`,
        });
    }

    //Validating the customer and vendor ids
    let vendorResponse;
    let customerResponse;
    try {
        const response = await usersCollection.find({
            $or: [
                { _id: customerId, role: 'customer' },
                { userId: vendor, role: 'vendor' },
            ],
        });

        response.forEach((userData) => {
            if (userData?.role === 'customer') customerResponse = userData;
            else if (userData?.role == 'vendor') vendorResponse = userData;
        });

        if (!customerResponse) {
            return res.status(400).json({
                success: false,
                message: 'Customer id is invalid.',
            });
        }

        if (!vendorResponse) {
            return res.status(400).json({
                success: false,
                message: 'Vendor id is invalid.',
            });
        }
    } catch (error) {
        console.log(
            'Error occured during validating the customer and vendor id while creating a mail : ',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem.',
        });
    }

    //Creating a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction(); //started the transaction : Active State

    try {
        //create order;
        const createdMail = await Mail.create(
            [
                {
                    sender: customerId,
                    receiver: vendorResponse._id,
                    documents: documents,
                    mail_id: uuidv4(),
                },
            ],
            { session }
        );

        //uptade mails array in the users document
        const updatedInfo = await usersCollection.findOneAndUpdate(
            { _id: customerId },
            { $push: { mails: createdMail[0]._id } },
            { new: true, session }
        );

        await session.commitTransaction(); //Changes are permanently saved to Database : Commited State
    } catch (error) {
        //in cse of failure , database is rolled back to the previous situation.
        await session.abortTransaction();
        console.log(
            'Error occured creating a mail docuemnt and updating the mails array in user document database : ',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem.',
        });
    } finally {
        //completed the execution
        session.endSession();
    }

    return res.status(200).json({
        success: true,
        message: 'Mail is sent successfully.',
    });
}

module.exports = {
    createMail,
};
