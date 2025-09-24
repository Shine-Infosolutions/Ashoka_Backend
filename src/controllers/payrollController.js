const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Staff = require('../models/Staff');

// Helper function to check Sunday
const isSunday = (date) => new Date(date).getDay() === 0;

/**
 * Generate monthly payroll by staffId
 */
exports.generatePayroll = async (req, res) => {
  try {
    const { staffId, month, year } = req.body;

    if (!staffId) return res.status(400).json({ message: 'staffId is required' });
    if (!month || month < 1 || month > 12) return res.status(400).json({ message: 'Invalid month' });
    if (!year || year < 2000) return res.status(400).json({ message: 'Invalid year' });

    // Fetch staff
    const staff = await Staff.findById(staffId).populate('userId', 'username email role');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const monthlySalary = staff.salary;

    // Start & end of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // exclusive

    // Fetch attendance records
    const attendanceRecords = await Attendance.find({
      staffId,
      date: { $gte: startDate, $lt: endDate }
    });

    // Prepare payroll details
    let totalDeduction = 0;
    let workingDays = 0;
    let paidDays = 0;
    let unpaidLeaves = 0;
    const details = [];

    // Map attendance by day for missing days
    const daysInMonth = new Date(year, month, 0).getDate();
    const attMap = {};
    attendanceRecords.forEach(att => attMap[att.date.toDateString()] = att);

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month - 1, d);
      if (isSunday(currentDate)) continue; // skip Sundays

      workingDays++;
      const dayStr = currentDate.toDateString();
      const att = attMap[dayStr];

      let status = 'absent';
      let leaveType = null;
      let deduction = 0;

      if (att) {
        status = att.status;
        leaveType = att.leaveType || null;
      }

      if (status === 'absent' || (status === 'leave' && leaveType === 'unpaid')) {
        deduction = monthlySalary / 30;
        unpaidLeaves++;
      } else if (status === 'half-day') {
        deduction = monthlySalary / 30 / 2;
        paidDays += 0.5;
      } else {
        paidDays++;
      }

      totalDeduction += deduction;
      details.push({ date: currentDate, status, leaveType, deduction });
    }

    const netSalary = monthlySalary - totalDeduction;

    // Create or update payroll
    let payroll = await Payroll.findOne({ staffId, month, year });
    if (payroll) {
      payroll.totalSalary = monthlySalary;
      payroll.workingDays = workingDays;
      payroll.paidDays = paidDays;
      payroll.unpaidLeaves = unpaidLeaves;
      payroll.deductions = totalDeduction;
      payroll.netSalary = netSalary;
      payroll.details = details;
      await payroll.save();
    } else {
      payroll = new Payroll({
        staffId,
        month,
        year,
        totalSalary: monthlySalary,
        workingDays,
        paidDays,
        unpaidLeaves,
        deductions: totalDeduction,
        netSalary,
        details
      });
      await payroll.save();
    }

    res.json({ message: 'Payroll generated', payroll });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
