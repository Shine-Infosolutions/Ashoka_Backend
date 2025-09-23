const mongoose = require('mongoose');

const RestaurantOrderSchema = new mongoose.Schema({
  staffName: {
    type: String,
    required: true
  },
   // For in-house (hotel guest) orders
   bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  grcNo: String,
  roomNumber: String,
  guestName: String,
  guestPhone: String,
  phoneNumber: {
    type: String,
    required: true
  },
  tableNo: {
    type: String,
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  notes: String,
  status: {
    type: String,
    enum: ['reserved','running', 'served' ],
  },
  amount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  isMembership: {
    type: Boolean,
    default: false
  },
  isLoyalty: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transferHistory: [{
    fromTable: String,
    toTable: String,
    reason: String,
    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.models.RestaurantOrder || mongoose.model('RestaurantOrder', RestaurantOrderSchema);