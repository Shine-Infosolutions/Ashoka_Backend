const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  room_number: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  floor_number: {
    type: String
  },
  bed_type: {
    type: String,
    enum: ['single', 'double', 'queen', 'king', 'twin']
  },
  extra_bed: {
    type: Boolean,
    default: false
  },
  is_reserved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'cleaning', 'maintenance', 'blocked'],
    default: 'available'
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }],
  inventory_items: [{
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    required_qty: {
      type: Number,
      default: 0
    }
  }]
}, { timestamps: true });

// ✅ Prevent OverwriteModelError + cleaner export
module.exports = mongoose.models.Room || mongoose.model('Room', RoomSchema);
