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

    if (!staffId) return res.status(400).json({ message: 'staffId is required' });

    const staff = await Staff.findById(staffId).populate('userId', 'username role');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    if (!staff.userId || staff.userId.role !== 'staff')
      return res.status(400).json({ message: 'Only staff can have attendance' });

    const validStatus = ['present', 'absent', 'half-day', 'leave'];
    if (!status || !validStatus.includes(status))
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatus.join(', ')}` });

    const validLeaveTypes = ['casual', 'sick', 'paid', 'unpaid', null];
    if (status === 'leave' && leaveType && !validLeaveTypes.includes(leaveType))
      return res.status(400).json({ message: `Invalid leaveType. Allowed: ${validLeaveTypes.join(', ')}` });

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check attendance for this day
    let attendance = await Attendance.findOne({
      staffId,
      date: { $gte: d, $lt: nextDay }
    });

    if (attendance) {
      // Update
      attendance.status = status;
      attendance.leaveType = status === 'leave' ? leaveType : null;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      await attendance.save();
    } else {
      // Create
      attendance = new Attendance({
        staffId,
        date: d,
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
