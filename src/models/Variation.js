const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema({
    // Zomato fields
    variantId: {
        type: String,
        unique: true,
        sparse: true
    },
    catalogueId: String,
    
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    basePrice: Number,
    historyPrice: Number,
    maxAllowedPrice: Number,
    
    available: {
        type: Boolean,
        default: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    
    // Zomato sync
    vendorEntityId: String,
    lastSyncedAt: Date
}, {
    timestamps: true,
    strict: false
});

module.exports = mongoose.model('Variation', variationSchema);