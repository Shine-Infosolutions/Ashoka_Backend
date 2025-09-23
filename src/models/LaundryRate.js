// models/LaundryRate.js
const mongoose = require("mongoose");

const laundryRateSchema = new mongoose.Schema({
  category: { type: String, enum: ["gentlemen", "ladies"], required: true },
  serviceType: { type: String, enum: ["dry_clean", "wash", "press"], required: true },
  itemName: { type: String, required: true },
  rate: { type: Number, required: true },
  unit: { type: String, enum: ["piece", "pair", "set"], default: "piece" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("LaundryRate", laundryRateSchema);
