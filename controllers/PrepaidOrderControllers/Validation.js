const { trusted } = require('mongoose');
const OrdersModel = require('../../models/OrderTypes/OngoingOrders.js');
const usersCollection = require('../../models/Users.js');
const cancelledOrders = require('../../models/OrderTypes/CancelledOrders.js');
const { v4: uuidv4 } = require('uuid');
const DocumentsModel = require('../../models/documents.js');
const { forEach } = require('jszip');
const cloudinary = require('cloudinary').v2;
const priceModel = require('../../models/priceSchema.js');

exports.validateFileFormatAndSizeController = (req, res, next) => {
    try {
        //extracting file Format and size
        const { format, size } = req.body;

        const formats = ['pdf'];

        // checking whether both are present or not
        if (!format) {
            return res.status(400).json({
                success: false,
                message: "You haven't specify format of the File",
            });
        }

        if (!size) {
            return res.status(400).json({
                success: false,
                message: "You haven't specify size of the File",
            });
        }

        if (isNaN(parseFloat(size))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid File Size',
            });
        }

        if (!formats) {
            return res.status(400).json({
                success: false,
                message: "You haven't specify formats",
            });
        }

        if (!(typeof format === 'string')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid File Format',
            });
        }

        if (!Array.isArray(formats)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Formats',
            });
        }

        if (!formats.includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid File Format',
            });
        }

        if (size <= 0) {
            return res.status(400).json({
                success: false,
                message: `File Size should be greater than 0 `,
            });
        }

        if (size > 9) {
            return res.status(400).json({
                success: false,
                message: `File Size is greater than 9Mb`,
            });
        }

        next();
    } catch (error) {
        console.log(
            'Error occured while validating the uploaded file format and size : ',
            error
        );
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
        });
    }
};

exports.validateOrder = async (req, res) => {
    try {
        const { vendorID, files, fileConfigs, price } = req.body;
        const { id } = req.tokenPayload;
        const userID = id;

        if (!userID) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the userID',
            });
        }

        if (!vendorID) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the vendorID',
            });
        }

        if (!files) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the files.',
            });
        }

        if (!Array.isArray(files)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid files',
            });
        }

        if (!(files.length > 0)) {
            return res.status(400).json({
                success: false,
                message: "Files' length can't be zero",
            });
        }

        if (!fileConfigs) {
            return res.status(400).json({
                success: false,
                message: 'Please specify the fileConfigs.',
            });
        }

        if (!Array.isArray(fileConfigs)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fileConfigs',
            });
        }

        if (!(fileConfigs.length > 0)) {
            return res.status(400).json({
                success: false,
                message: "FileConfigs' length can't be zero",
            });
        }

        if (!price) {
            return res.status(400).json({
                success: false,
                message: 'Please specify price.',
            });
        }

        if (typeof price !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Invalid price.',
            });
        }

        if (!(price > 0)) {
            return res.status(400).json({
                success: false,
                message: "Price can't be less than or equal to zero",
            });
        }

        if (files.length !== fileConfigs.length) {
            return res.status(400).json({
                success: false,
                message:
                    "Files' length and Fileconfigs' length can't be different",
            });
        }

        for (let i = 0; i < files.length; i++) {
            if (typeof files[i] === 'object') {
                if (Object.keys(files[i]).length === 3) {
                    if (
                        'fileName' in files[i] &&
                        'public_id' in files[i] &&
                        'secure_url' in files[i]
                    ) {
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: "Files doesn't contain required field",
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Files should have length equal to 3 .',
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Files should be object.',
                });
            }
        }

        for (let i = 0; i < fileConfigs.length; i++) {
            if (typeof fileConfigs[i] === 'object') {
                if (Object.keys(fileConfigs[i]).length === 6) {
                    if (
                        'backToBack' in fileConfigs[i] &&
                        'color' in fileConfigs[i] &&
                        'copies' in fileConfigs[i] &&
                        'numberOfPages' in fileConfigs[i] &&
                        'orientation' in fileConfigs[i] &&
                        'specialRequest' in fileConfigs[i]
                    ) {
                    } else {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Fileconfigs doesn't contain required field",
                        });
                    }
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Fileconfigs should have length equal to 6',
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Fileconfigs should be object',
                });
            }
        }

        // checking whether vendor is valid or not
        const isVendorValid = await usersCollection
            .findOne({ userId: vendorID, role: 'vendor' })
            .select('-_id vendorAdditionalDetails collegeCode')
            .populate({
                path: 'vendorAdditionalDetails',
                select: '-_id priceSchema',
            });

        if (!isVendorValid) {
            return res.status(400).json({
                success: false,
                message: "Such Vendor doesn't exists",
            });
        }

        //Checking the price with original price
        const priceDetails = await priceModel
            .findOne({ _id: isVendorValid.vendorAdditionalDetails.priceSchema })
            .select('-_id -vendor');

        let original_price = 0;
        let numberofBlackAndWhitePrints_SingleSide = 0;
        let numberofBlackAndWhitePrints_BackToBack = 0;
        let numberofColoredPrints_SingleSide = 0;
        let numberofColoredPrints_backToBack = 0;

        //Counting the pages
        for (let i = 0; i < fileConfigs.length; i++) {
            if (fileConfigs[i].color === 'colored') {
                if (fileConfigs[i].backToBack) {
                    numberofColoredPrints_backToBack +=
                        fileConfigs[i].numberOfPages * fileConfigs[i].copies;
                } else {
                    numberofColoredPrints_SingleSide +=
                        fileConfigs[i].numberOfPages * fileConfigs[i].copies;
                }
            } else {
                if (fileConfigs[i].backToBack) {
                    numberofBlackAndWhitePrints_BackToBack +=
                        fileConfigs[i].numberOfPages * fileConfigs[i].copies;
                } else {
                    numberofBlackAndWhitePrints_SingleSide +=
                        fileConfigs[i].numberOfPages * fileConfigs[i].copies;
                }
            }
        }

        //Calculating the Price

        //Including price of color Printouts
        //[]->at index 0 -> storing applicable price , at index 1 -> pricing mode
        let applicablePriceSchema_BW_SS = [];
        let applicablePriceSchema_BW_BB = [];
        let applicablePriceSchema_C_SS = [];
        let applicablePriceSchema_C_BB = [];

        const priceSchema = priceDetails.priceSchema;

        //Calculating the price of singleSide black and white prints

        if (numberofBlackAndWhitePrints_BackToBack === 1) {
            numberofBlackAndWhitePrints_BackToBack = 0;
            numberofBlackAndWhitePrints_SingleSide = 1;
        }

        if (numberofColoredPrints_backToBack === 1) {
            numberofColoredPrints_backToBack = 0;
            numberofColoredPrints_SingleSide = 1;
        }

        if (numberofBlackAndWhitePrints_SingleSide > 0) {
            for (let i = 0; i < priceSchema.length; i++) {
                if (
                    priceSchema[i].printingMethod === 'singleSide' &&
                    priceSchema[i].colour === 'blackAndWhite'
                ) {
                    if (priceSchema[i].rangeType === 'above') {
                        if (
                            numberofBlackAndWhitePrints_SingleSide >
                            priceSchema[i].aboveValue
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_BW_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofBlackAndWhitePrints_SingleSide *
                                    applicablePriceSchema_BW_SS[0];
                                break;
                            } else {
                                applicablePriceSchema_BW_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    applicablePriceSchema_BW_SS[0];
                                break;
                            }
                        }
                    }
                    if (priceSchema[i].rangeType === 'range') {
                        if (
                            priceSchema[i].startingRange <=
                                numberofBlackAndWhitePrints_SingleSide &&
                            priceSchema[i].endingRange >=
                                numberofBlackAndWhitePrints_SingleSide
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_BW_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofBlackAndWhitePrints_SingleSide *
                                    applicablePriceSchema_BW_SS[0];
                                break;
                            } else {
                                applicablePriceSchema_BW_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    applicablePriceSchema_BW_SS[0];
                                break;
                            }
                        }
                    }
                }
            }
        }

        //Calculating the price of bothSide black and white prints
        if (numberofBlackAndWhitePrints_BackToBack > 0) {
            for (let i = 0; i < priceSchema.length; i++) {
                if (
                    priceSchema[i].printingMethod === 'backToBack' &&
                    priceSchema[i].colour === 'blackAndWhite'
                ) {
                    if (priceSchema[i].rangeType === 'above') {
                        if (
                            numberofBlackAndWhitePrints_BackToBack >
                            priceSchema[i].aboveValue
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_BW_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofBlackAndWhitePrints_BackToBack *
                                    applicablePriceSchema_BW_BB[0];
                                break;
                            } else {
                                applicablePriceSchema_BW_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    applicablePriceSchema_BW_BB[0];
                                break;
                            }
                        }
                    }

                    if (priceSchema[i].rangeType === 'range') {
                        if (
                            priceSchema[i].startingRange <=
                                numberofBlackAndWhitePrints_BackToBack &&
                            priceSchema[i].endingRange >=
                                numberofBlackAndWhitePrints_BackToBack
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_BW_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofBlackAndWhitePrints_BackToBack *
                                    applicablePriceSchema_BW_BB[0];
                                break;
                            } else {
                                applicablePriceSchema_BW_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    applicablePriceSchema_BW_BB[0];
                                break;
                            }
                        }
                    }
                }
            }
        }

        //Calculating the price of single Side Color print
        if (numberofColoredPrints_SingleSide > 0) {
            for (let i = 0; i < priceSchema.length; i++) {
                if (
                    priceSchema[i].printingMethod === 'singleSide' &&
                    priceSchema[i].colour === 'colour'
                ) {
                    if (priceSchema[i].rangeType === 'above') {
                        if (
                            numberofColoredPrints_SingleSide >
                            priceSchema[i].aboveValue
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_C_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofColoredPrints_SingleSide *
                                    applicablePriceSchema_C_SS[0];
                                break;
                            } else {
                                applicablePriceSchema_C_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price += applicablePriceSchema_C_SS[0];
                                break;
                            }
                        }
                    }

                    if (priceSchema[i].rangeType === 'range') {
                        if (
                            priceSchema[i].startingRange <=
                                numberofColoredPrints_SingleSide &&
                            priceSchema[i].endingRange >=
                                numberofColoredPrints_SingleSide
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_C_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofColoredPrints_SingleSide *
                                    applicablePriceSchema_C_SS[0];
                                break;
                            } else {
                                applicablePriceSchema_C_SS = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price += applicablePriceSchema_C_SS[0];
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (numberofColoredPrints_backToBack > 0) {
            for (let i = 0; i < priceSchema.length; i++) {
                if (
                    priceSchema[i].printingMethod === 'backToBack' &&
                    priceSchema[i].colour === 'colour'
                ) {
                    if (priceSchema[i].rangeType === 'above') {
                        if (
                            numberofColoredPrints_backToBack >
                            priceSchema[i].aboveValue
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_C_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofColoredPrints_backToBack *
                                    applicablePriceSchema_C_BB[0];
                                break;
                            } else {
                                applicablePriceSchema_C_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price += applicablePriceSchema_C_BB[0];
                                break;
                            }
                        }
                    }

                    if (priceSchema[i].rangeType === 'range') {
                        if (
                            priceSchema[i].startingRange <=
                                numberofColoredPrints_backToBack &&
                            priceSchema[i].endingRange >=
                                numberofColoredPrints_backToBack
                        ) {
                            if (priceSchema[i].pricingMethod === 'perPrint') {
                                applicablePriceSchema_C_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price +=
                                    numberofColoredPrints_backToBacknumberofColoredPrints_SingleSide *
                                    applicablePriceSchema_C_BB[0];
                                break;
                            } else {
                                applicablePriceSchema_C_BB = [
                                    priceSchema[i].price,
                                    priceSchema[i].pricingMethod,
                                ];
                                original_price += applicablePriceSchema_C_BB[0];
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (price !== original_price) {
            return res.status(400).json({
                success: false,
                message: 'Price is altered.',
            });
        }

        // checking whether user is valid or not
        const isUserValid = await usersCollection.findOne({
            role: 'user',
            _id: userID,
        });

        if (!isUserValid) {
            return res.status(400).json({
                success: false,
                message: "Such User doesn't exists",
            });
        }

        if (!isUserValid.collegeCode.equals(isVendorValid.collegeCode)) {
            return res.status(400).json({
                success: false,
                message:
                    "Order can't be placed as user and vendor belongs to differet College",
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Order Validated Successfully',
            userId: isUserValid?.userId,
        });
    } catch (e) {
        console.log('Error occured while validating the order : ', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Problem',
            error: e.message,
        });
    }
};
