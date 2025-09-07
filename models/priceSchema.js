const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    priceSchema: [
        {
            type: Object,
            required: true,
        },
    ],
});

module.exports = mongoose.model('priceSchema', priceSchema);
