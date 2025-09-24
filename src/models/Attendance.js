const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staff', 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'half-day', 'leave'], 
    required: true 
  },
  leaveType: { 
    type: String, 
    enum: ['casual', 'sick', 'paid', 'unpaid'], 
    default: null 
  },
  checkIn: { type: Date },
  checkOut: { type: Date },
  remarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
