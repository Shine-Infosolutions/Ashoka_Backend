const mongoose = require('mongoose');

const PantryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 5
  },
  unit: {
    type: String,
    default: 'piece'
  }
}, { timestamps: true });

module.exports = mongoose.models.PantryItem || mongoose.model('PantryItem', PantryItemSchema);