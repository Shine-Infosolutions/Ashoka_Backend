const mongoose = require('mongoose');

const kitchenStoreSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PantryItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  disbursementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disbursement'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('KitchenStore', kitchenStoreSchema);