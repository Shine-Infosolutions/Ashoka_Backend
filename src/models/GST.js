const mongoose = require('mongoose');

const gstSchema = new mongoose.Schema({
  totalGST: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100 
  },
  cgst: { 
    type: Number, 
    required: true,
    min: 0 
  },
  sgst: { 
    type: Number, 
    required: true,
    min: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Validate that CGST + SGST = Total GST
gstSchema.pre('save', function(next) {
  if (this.cgst + this.sgst !== this.totalGST) {
    return next(new Error('CGST + SGST must equal Total GST'));
  }
  next();
});

module.exports = mongoose.model('GST', gstSchema);