const mongoose = require('mongoose');

const PantryOrderSchema = new mongoose.Schema({
  guestName: {
    type: String,
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PantryItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor"   // ✅ link to Vendor
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['Kitchen to Pantry', 'Pantry to Reception', 'Reception to Vendor'],
    default: 'room_service'
  },
  specialInstructions: {
    type: String
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveredAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.models.PantryOrder || mongoose.model('PantryOrder', PantryOrderSchema);