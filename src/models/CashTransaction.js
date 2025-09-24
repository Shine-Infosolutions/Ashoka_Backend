const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['KEEP', 'SENT'], // IN = received at reception, OUT = sent to office
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  }, // Optional: "Guest Payment" / "Sent to Office"
  receptionistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }, 
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);
