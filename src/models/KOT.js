const mongoose = require('mongoose');

const kotSchema = new mongoose.Schema({
  kotNumber: {
    type: String,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }, 
  orderNumber: {
    type: String
  },
  orderType: {
    type: String,
    enum: ['restaurant', 'room-service'],
    default: 'restaurant'
  },
  tableNumber: {
    type: String
  },
  customerName: {
    type: String
  },
  items: [{
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variation: {
      variationId: {
        type: String,
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
        min: 0,
      },
    },
    addons: [{
      addonId: {
        type: String,
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
        min: 0,
      },
    }],
    status: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
      default: 'PENDING'
    },
    timeToPrepare: {
      type: Number,
      default: 15,
      min: 1
    },
    startedAt: Date,
    readyAt: Date,
    actualPrepTime: String,
    specialInstructions: {
      type: String,
      default: ''
    }
  }],
  extraItems: [{
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variation: {
      variationId: {
        type: String,
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
        min: 0,
      },
    },
    addons: [{
      addonId: {
        type: String,
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
        min: 0,
      },
    }],
    status: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
      default: 'PENDING'
    },
    timeToPrepare: {
      type: Number,
      default: 15,
      min: 1
    },
    startedAt: Date,
    readyAt: Date,
    actualPrepTime: String,
    specialInstructions: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'PAID'],
    default: 'PENDING'
  },
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  notes: {
    type: String,
    default: ''
  },
  printedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-generate KOT number
kotSchema.pre('save', async function(next) {
  if (!this.kotNumber) {
    const count = await mongoose.model('KOT').countDocuments();
    this.kotNumber = `KOT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
kotSchema.index({ kotNumber: 1 });
kotSchema.index({ orderId: 1 });
kotSchema.index({ status: 1 });
kotSchema.index({ createdAt: -1 });

module.exports = mongoose.model('KOT', kotSchema);
