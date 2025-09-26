const express = require('express');
const router = express.Router();
const housekeepingController = require('../controllers/housekeepingController');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

// const upload = require('../middleware/uploadMiddleware');

// Create a new housekeeping task (admin or staff from reception/housekeeping)
router.post(
  '/tasks',
  
  housekeepingController.createTask
);

// Get all housekeeping tasks
router.get(
  '/tasks',
  authMiddleware(['admin', 'staff'], ['housekeeping']),
  housekeepingController.getAllTasks
);

// Get a single task by ID
router.get(
  '/tasks/:taskId',
  authMiddleware(['admin', 'staff'], ['housekeeping']),
  housekeepingController.getTaskById
);

// Get tasks assigned to specific staff
router.get(
  '/staff/:staffId/tasks',
  authMiddleware(['admin', 'staff']), // Allow any staff to view their own tasks
  housekeepingController.getStaffTasks
);

//get incep check
router.get('/roominspection/:roomId', housekeepingController.getChecklistByRoom);
router.get('/checklist/:roomId', housekeepingController.getChecklistByRoom);

// Update task status
router.patch(
  '/tasks/:taskId/status',
  authMiddleware(['admin', 'staff'], ['housekeeping']), // Specifically allow housekeeping staff
  housekeepingController.updateTaskStatus
);

router.put(
  '/tasks/:taskId/status',
  authMiddleware(['admin', 'staff'], ['housekeeping']),
  housekeepingController.updateTaskStatus
);

// Assign task to staff
router.put(
  '/tasks/:taskId/assign',
  authMiddleware(['admin', 'staff'], ['housekeeping']),
  housekeepingController.assignTask
);

router.put('/room/:inspectionId', housekeepingController.updateRoomInspection);

// Report issue with room
router.post(
  '/tasks/:taskId/issues',
  authMiddleware(['admin', 'staff'], ['housekeeping']),
  housekeepingController.reportIssue
);
// POST: Create a new inspection (minibar or floor-checklist)
router.post('/roominspection', housekeepingController.getAllRoomInspections);
router.post('/room-inspection', housekeepingController.createRoomInspection);

// Resolve reported issue
router.put(
  '/tasks/:taskId/issues/:issueId/resolve',
  authMiddleware(['admin', 'staff'], ['housekeeping']),
  housekeepingController.resolveIssue
);

// Delete a task
router.delete(
  '/tasks/:taskId',
  authMiddleware(['admin']),
  housekeepingController.deleteTask
);

// Get room cleaning history
router.get(
  '/rooms/:roomId/history',
  authMiddleware(['admin', 'staff'], ['housekeeping', 'reception']),
  housekeepingController.getRoomHistory
);

// Get available housekeeping staff
router.get(
  '/available-staff',
  authMiddleware(['admin', 'staff'], ['reception', 'housekeeping']),
  housekeepingController.getAvailableStaff
);

// Upload images (Base64)
router.post(
  '/tasks/:taskId/images/before',
  authMiddleware(['admin', 'staff']),
  uploadController.uploadBase64Images
);

router.post(
  '/tasks/:taskId/images/after',
  authMiddleware(['admin', 'staff']),
  uploadController.uploadBase64Images
);

module.exports = router;