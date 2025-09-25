const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: Date, default: Date.now },
  department: { type: String },
});

module.exports = mongoose.model("Staff", staffSchema);
