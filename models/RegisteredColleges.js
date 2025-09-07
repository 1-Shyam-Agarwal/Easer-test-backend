const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    collegeName: {
        type: String,
        required: true,
    },

    collegeState: {
        type: String,
        required: true,
    },

    collegeDistrict: {
        type: String,
        required: true,
    },

    websiteUrl: {
        type: String,
    },

    yearOfEstablishment: {
        type: String,
    },

    location: {
        type: String,
        required: true,
    },

    management: {
        type: String,
        required: true,
    },

    universityName: {
        type: String,
    },

    universityType: {
        type: String,
    },

    collegeCode: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('registeredColleges', collegeSchema);
