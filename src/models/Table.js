const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  location: {
    type: String,
    enum: ['dining', 'rooftop'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Clear any existing model to avoid caching issues
if (mongoose.models.Table) {
  delete mongoose.models.Table;
}

module.exports = mongoose.model('Table', TableSchema);