const mongoose = require('mongoose');

const DisbursementSchema = new mongoose.Schema({
  disbursementNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['kitchen_to_pantry', 'pantry_to_kitchen', 'stock_adjustment'],
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PantryItem',
      required: true
    },
    itemName: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: String,
    operation: {
      type: String,
      enum: ['add', 'subtract'],
      required: true
    },
    previousStock: Number,
    newStock: Number
  }],
  totalItems: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
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