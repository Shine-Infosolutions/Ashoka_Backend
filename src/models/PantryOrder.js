const mongoose = require("mongoose");

const PantryOrderSchema = new mongoose.Schema(
  {
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PantryItem",
          required: true,
        },
        quantity: {
          type: String,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // ✅ link to Vendor
    },
    kitchenOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KitchenOrder",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "preparing",
        "ready",
        "delivered",
        "fulfilled",
        "cancelled",
      ],
      default: "pending",
    },
    orderType: {
      type: String,
      enum: ["Pantry to Kitchen", "Kitchen to Pantry", "Pantry to vendor"],
      default: "room_service",
    },
    specialInstructions: {
      type: String,
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveredAt: {
      type: Date,
    },
    chalanImage: String,
    fulfillment: {
      previousAmount: Number,
      newAmount: Number,
      difference: Number,
      pricingImage: String,
      chalanImage: String,
      fulfilledAt: Date,
      fulfilledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      notes: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partial"],
      default: "pending",
    },
    paymentDetails: {
      paidAmount: {
        type: Number,
        default: 0,
      },
      paidAt: Date,
      paymentMethod: String,
      transactionId: String,
      notes: String,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PantryOrder ||
  mongoose.model("PantryOrder", PantryOrderSchema);
