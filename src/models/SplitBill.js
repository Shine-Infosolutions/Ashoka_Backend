const mongoose = require('mongoose');

const splitBillSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantOrder', required: true },
  splits: [{
    splitNumber: Number,
    customerName: String,
    items: Array,
    totalAmount: Number,
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    paymentDetails: Object
  }],
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('SplitBill', splitBillSchema);
