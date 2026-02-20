const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  veg: {
    type: Boolean,
    default: true
  },
  available: {
    type: Boolean,
    default: true
  }
});

const Addon = mongoose.model('Addon', addonSchema);
module.exports = Addon;