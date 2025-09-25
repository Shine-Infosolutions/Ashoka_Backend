const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Mark or update attendance
router.post('/mark', attendanceController.markAttendance);

// Get attendance by user or date
router.get('/get', attendanceController.getAttendance);
router.get('/all', attendanceController.getAllAttendance);

module.exports = router;
