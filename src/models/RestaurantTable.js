const mongoose = require('mongoose');

const restaurantTableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  location: {
    type: String,
    default: 'Main Hall'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RestaurantTable', restaurantTableSchema);
