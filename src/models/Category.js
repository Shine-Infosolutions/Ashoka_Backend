const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  base_price: { type: Number, required: true },
  extra_bed_charge: { type: Number, default: 0 },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  inventory_template: [{
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    required_qty: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);