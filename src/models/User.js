const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'restaurant', 'pantry'], required: true },
  restaurantRole: { type: String, enum: ['staff', 'cashier', 'chef'], required: false },
  department: {
    type: mongoose.Schema.Types.Mixed, // can be string or array
    required: false
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
