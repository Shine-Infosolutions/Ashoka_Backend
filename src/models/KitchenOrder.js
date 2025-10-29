const mongoose = require('mongoose');

const KitchenOrderSchema = new mongoose.Schema({
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PantryItem',
      required: true
    },
    quantity: {
      type: String,
      required: true,
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
    ref: "Vendor"
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'preparing', 'ready', 'delivered', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['kitchen_preparation', 'kitchen_to_pantry',  'kitchen_to_vendor'],
    default: 'kitchen_preparation'
  },
  specialInstructions: {
    type: String
  },
  deliveredAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.models.KitchenOrder || mongoose.model('KitchenOrder', KitchenOrderSchema);