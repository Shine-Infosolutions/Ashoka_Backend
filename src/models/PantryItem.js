const mongoose = require('mongoose');

const PantryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PantryCategory', // Reference to master category
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
    enum: [
      'piece',
      'plate',
      'bowl',
      'glass',
      'cup',
      'bottle',
      'ml',
      'ltr',
      'gram',
      'kg',
      'packet',
      'combo',
      'slice',
      'scoop',
      'portion'
    ],
    default: 'piece'
  }  
}, { timestamps: true });

module.exports = mongoose.models.PantryItem || mongoose.model('PantryItem', PantryItemSchema);