const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
    sparse: true
  },
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

billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `BILL${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
