const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

// Utility function to check if a date is Sunday
const isSunday = (date) => new Date(date).getDay() === 0;

/**
 * Mark or update attendance
 */
exports.markAttendance = async (req, res) => {
  try {
    const { staffId, date, status, leaveType, checkIn, checkOut, remarks } = req.body;

    // Validate staffId
    if (!staffId) return res.status(400).json({ message: 'staffId is required' });

    const staff = await Staff.findById(staffId).populate('userId', 'username role');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    // Only staff role can have attendance
    if (!staff.userId || staff.userId.role !== 'staff') 
      return res.status(400).json({ message: 'Only staff can have attendance' });

    // Validate status
    const validStatus = ['present', 'absent', 'half-day', 'leave'];
    if (!status || !validStatus.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatus.join(', ')}` });
    }

    // Validate leaveType if status is leave
    const validLeaveTypes = ['casual', 'sick', 'paid', 'unpaid', null];
    if (status === 'leave' && leaveType && !validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({ message: `Invalid leaveType. Allowed: ${validLeaveTypes.join(', ')}` });
    }

    // Prevent marking Sunday absence
    if (isSunday(date) && status === 'absent') {
      return res.status(400).json({ message: 'Cannot mark absence on Sunday' });
    }

    // Check if attendance exists for this staff + date
    let attendance = await Attendance.findOne({ staffId, date: new Date(date) });

    if (attendance) {
      // Update existing
      attendance.status = status;
      attendance.leaveType = leaveType || attendance.leaveType;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      await attendance.save();
    } else {
      // Create new
      attendance = new Attendance({
        staffId,
        date,
        status,
        leaveType: status === 'leave' ? leaveType : null,
        checkIn,
        checkOut,
        remarks
      });
      await attendance.save();
    }

    res.json({ message: 'Attendance saved', attendance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get attendance by staffId or date
 */
exports.getAttendance = async (req, res) => {
  try {
    const { staffId, date } = req.query;
    let filter = {};

    if (staffId) {
      const staff = await Staff.findById(staffId).populate('userId', 'username role');
      if (!staff) return res.status(404).json({ message: 'Staff not found' });
      filter.staffId = staff._id;
    }

    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'staffId',
        populate: { path: 'userId', select: 'username email role' }
      });

    res.json(records);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
