// models/Laundry.js
const mongoose = require("mongoose");

const laundrySchema = new mongoose.Schema({
  grcNo: String,
  roomNumber: String,

  requestedByName: String, // Guest name
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',  
  },
  items: [
    {
      rateId: { type: mongoose.Schema.Types.ObjectId, ref: "LaundryRate", required: true },
      itemName: String,
      quantity: { type: Number, default: 1, min: 0 },
      deliveredQuantity: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        enum: ["pending", "picked_up", "ready", "delivered", "cancelled"],
        default: "pending",
      },
      calculatedAmount: { type: Number, required: true },
      damageReported: { type: Boolean, default: false },
      itemNotes: String,
    }
  ],

  isUrgent: { type: Boolean, default: false },
  urgencyNote: String,
  specialInstructions: String,

  laundryStatus: {
    type: String,
    enum: ["pending", "in_progress", "partially_delivered", "completed", "cancelled"],
    default: "pending",
  },

  pickupTime: Date,
  deliveredTime: Date,
  scheduledPickupTime: Date,
  scheduledDeliveryTime: Date,
  pickupBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receivedBy: String,

  damageReported: { type: Boolean, default: false },
  damageNotes: String,
  discardReason: String,
  returnDeadline: Date,
  lossNote: String,
  isLost: { type: Boolean, default: false },
  isFound: { type: Boolean, default: false },
  foundDate: Date,
  foundRemarks: String,
  lostDate: Date,

  // Billing
  isBillable: { type: Boolean, default: true }, 
  totalAmount: { type: Number, required: true },
  isComplimentary: { type: Boolean, default: false },
  billStatus: {
    type: String,
    enum: ["unpaid", "paid", "waived"],
    default: "unpaid",
  },

  isReturned: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },

}, { timestamps: true });

// Auto-calc total + itemName
laundrySchema.pre("save", async function (next) {
  if (this.items?.length) {
    let total = 0;
    for (let item of this.items) {
      if (item.rateId) {
        const rateDoc = await mongoose.model("LaundryRate").findById(item.rateId);
        if (rateDoc) {
          if (!item.itemName) item.itemName = rateDoc.itemName; 
          if (!item.calculatedAmount) {
            item.calculatedAmount = rateDoc.rate * item.quantity;
          }
        }
      }
      total += item.calculatedAmount || 0;
    }
    this.totalAmount = total;
  }
  next();
});

module.exports = mongoose.model("Laundry", laundrySchema);
