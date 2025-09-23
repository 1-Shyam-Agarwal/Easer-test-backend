const mongoose = require('mongoose');

const usedOrderOTPSchema = new mongoose.Schema({
  orderOtps: {
    type: [String],   // array of strings
    required: true,
    default: [],      // start with an empty array
  },
}, { timestamps: true });

// Ensure only one document exists in this collection
usedOrderOTPSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({ orderOtps: [] });
  }
  return doc;
};

module.exports = mongoose.model('UsedOrderOTP', usedOrderOTPSchema);
