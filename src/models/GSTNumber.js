const mongoose = require('mongoose');

const gstNumberSchema = new mongoose.Schema({
  gstNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  },
  companyName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GSTNumber', gstNumberSchema);