const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantOrder',
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online', 'split'],
    default: 'cash'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid'
  },
  splitPayments: [{
    amount: Number,
    method: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);
