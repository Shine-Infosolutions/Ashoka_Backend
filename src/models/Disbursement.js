const mongoose = require('mongoose');

const disbursementSchema = new mongoose.Schema({
  disbursementNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['pantry_to_kitchen', 'kitchen_to_pantry', 'stock_adjustment'],
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disbursedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Disbursement', disbursementSchema);