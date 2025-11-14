const mongoose = require('mongoose');

const gstSchema = new mongoose.Schema({
  totalGST: { 
    type: Number,
    min: 0,
    max: 100 
  },
  cgst: { 
    type: Number,
    min: 0 
  },
  sgst: { 
    type: Number,
    min: 0 
  },
  name: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: String,
    match: [/^[0-9]{10}$/, 'Mobile number must be 10 digits']
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Validate GST calculations
gstSchema.pre('save', function(next) {
  if (this.igst > 0) {
    if (this.igst !== this.totalGST || this.cgst !== 0 || this.sgst !== 0) {
      return next(new Error('For interstate: IGST must equal Total GST, CGST and SGST must be 0'));
    }
  } else {
    if (this.cgst + this.sgst !== this.totalGST) {
      return next(new Error('For intrastate: CGST + SGST must equal Total GST'));
    }
  }
  next();
});

// Indexes
gstSchema.index({ gstNumber: 1 });
gstSchema.index({ mobileNumber: 1 });
gstSchema.index({ company: 1 });
gstSchema.index({ city: 1 });

module.exports = mongoose.model('GST', gstSchema);