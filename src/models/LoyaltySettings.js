const mongoose = require('mongoose');

const loyaltySettingsSchema = new mongoose.Schema({
  redeemRate: { type: Number, default: 10 },
  earnRate: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltySettings', loyaltySettingsSchema);
