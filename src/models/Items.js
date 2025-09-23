const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  Price: { type: Number, required: true },
  category: { type: String, required: true },
  Discount: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  in_oostock: { type: Boolean, default: true },
  image: { type: String, default: '' },
  video: { type: String, default: '' },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);
