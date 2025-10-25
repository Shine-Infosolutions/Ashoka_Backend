const mongoose = require('mongoose');

const DisbursementSchema = new mongoose.Schema({
  disbursementNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PantryItem',
      required: true
    },
    itemName: String,
    quantity: Number,
    unit: String
  }],
  totalItems: Number,
  disbursedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disbursedAt: {
    type: Date,
    default: Date.now
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Disbursement', DisbursementSchema);