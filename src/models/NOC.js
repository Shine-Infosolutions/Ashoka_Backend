const mongoose = require('mongoose');

const nocSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  authorityType: {
    type: String,
    required: true,
    enum: ['manager', 'owner', 'admin', 'supervisor'],
    default: 'manager'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NOC', nocSchema);
