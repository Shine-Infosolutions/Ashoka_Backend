const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

// Utility: check if a date is Sunday
const isSunday = (date) => new Date(date).getDay() === 0;

// Utility: returns start/end of day
const getDayRange = (date) => {
  let d = new Date(date);
  d.setHours(0, 0, 0, 0);
  let next = new Date(d);
  next.setDate(next.getDate() + 1);
  return {start: d, end: next};
};

// Auto-mark all Sundays for staff in a given month as 'present'
exports.autoMarkSundays = async (staffId, year, month) => {
  // month: 0-indexed (0=Jan, 11=Dec)
  let day = new Date(year, month, 1);
  let end = new Date(year, month + 1, 1);
  while (day < end) {
    if (isSunday(day)) {
      let {start, end: nextDay} = getDayRange(day);
      let found = await Attendance.findOne({staffId, date: {$gte: start, $lt: nextDay}});
      if (!found) {
        await Attendance.create({
          staffId,
          date: new Date(day),
          status: 'present',
          remarks: 'Auto Sunday (paid)'
        });
      }
    }
    day.setDate(day.getDate() + 1);
  }
};

/**
 * MARK or update attendance with business logic
 */
exports.markAttendance = async (req, res) => {
  try {
    let { staffId, date, status, leaveType, checkIn, checkOut, remarks } = req.body;
    if (!staffId) return res.status(400).json({ message: 'staffId is required' });

    const staff = await Staff.findById(staffId).populate('userId', 'role');
    if (!staff || !staff.userId || staff.userId.role !== 'staff')
      return res.status(404).json({ message: 'Staff not found/invalid' });

    let d = new Date(date); d.setHours(0, 0, 0, 0);
    let isSun = isSunday(d);

    // Sundays: always present, only via auto logic, skip manual entry
    if (isSun)
      return res.status(400).json({ message: 'Manual attendance not needed for Sundays; handled automatically.' });

    // Auto half-day logic
    let workedHours = null;
    if (checkIn && checkOut) {
      workedHours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
      if (workedHours < 4) status = 'half-day';
    }

    // Validate status & leaveType
    const validStatus = ['present', 'absent', 'half-day', 'leave'];
    if (!status || !validStatus.includes(status))
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatus.join(', ')}` });

    const validLeaveTypes = ['casual', 'sick', 'paid', 'unpaid', null];
    if (status === 'leave' && (!leaveType || !validLeaveTypes.includes(leaveType)))
      return res.status(400).json({ message: `Invalid or missing leaveType. Allowed: ${validLeaveTypes.join(', ')}` });

    // Upsert attendance
    let {start, end: nextDay} = getDayRange(d);
    let attendance = await Attendance.findOne({staffId, date: {$gte: start, $lt: nextDay} });
    if (attendance) {
      attendance.status = status;
      attendance.leaveType = status === 'leave' ? leaveType : null;
      attendance.checkIn = checkIn || attendance.checkIn;
      attendance.checkOut = checkOut || attendance.checkOut;
      attendance.remarks = remarks || attendance.remarks;
      await attendance.save();
    } else {
      attendance = new Attendance({staffId, date: d, status, leaveType: status === 'leave' ? leaveType : null, checkIn, checkOut, remarks });
      await attendance.save();
    }

    res.json({ message: 'Attendance saved', attendance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET attendance by staffId or date
 */
exports.getAttendance = async (req, res) => {
  try {
    const { staffId, date } = req.query;
    let filter = {};
    if (staffId) {
      const staff = await Staff.findById(staffId).populate('userId', 'role');
      if (!staff) return res.status(404).json({ message: 'Staff not found' });
      filter.staffId = staff._id;
    }
    if (date) {
      let {start, end} = getDayRange(date);
      filter.date = { $gte: start, $lt: end };
    }
    const records = await Attendance.find(filter)
      .populate({ path: 'staffId', populate: { path: 'userId', select: 'username email role' } });
    res.json(records);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET all attendance
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ date: -1 })
      .populate({ path: 'staffId', populate: { path: 'userId', select: 'username email role' } });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /attendance/status
exports.updateAttendanceStatus = async (req, res) => {
  try {
    const { attendanceId, status, leaveType } = req.body;

    if (!attendanceId) return res.status(400).json({ message: 'attendanceId is required' });
    if (!status) return res.status(400).json({ message: 'status is required' });

    const validStatus = ['present', 'absent', 'half-day', 'leave'];
    if (!validStatus.includes(status))
      return res.status(400).json({ message: `Invalid status. Allowed: ${validStatus.join(', ')}` });

    const validLeaveTypes = ['casual', 'sick', 'paid', 'unpaid', null];
    if (status === 'leave' && (!leaveType || !validLeaveTypes.includes(leaveType)))
      return res.status(400).json({ message: `Invalid or missing leaveType. Allowed: ${validLeaveTypes.join(', ')}` });

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    // Prevent changing Sundays (auto-marked)
    const day = new Date(attendance.date);
    if (day.getDay() === 0)
      return res.status(400).json({ message: 'Cannot change status for Sundays; handled automatically.' });

    attendance.status = status;
    attendance.leaveType = status === 'leave' ? leaveType : null;

    await attendance.save();

    res.json({ message: 'Attendance status updated', attendance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
