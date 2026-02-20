const express = require('express');
const router = express.Router();
const kotController = require('../controllers/kotController');
const { auth, authorize } = require('../middleware/auth');

// Create new KOT (Admin, Staff, Front Desk)
router.post('/create', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), kotController.createKOT);

// Get all KOTs (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), kotController.getAllKOTs);

// Update KOT status (Admin, Staff, Front Desk)
router.patch('/:id/status', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), kotController.updateKOTStatus);

// Update KOT item statuses (Admin, Staff, Front Desk)
router.patch('/:id/item-statuses', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), kotController.updateItemStatuses);

// NEW ENHANCED ROUTES FOR KOT SYSTEM

// Get all KOTs with filters
router.get('/', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), kotController.getKOTs);

// Get KOT by ID
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), kotController.getKOTById);

// Update individual item status in KOT
router.patch('/:id/item/:itemIndex/status', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), kotController.updateKOTItemStatus);

// Update KOT priority
router.patch('/:id/priority', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), kotController.updateKOTPriority);

// Print KOT
router.post('/:id/print', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), kotController.printKOT);

// Get kitchen dashboard
router.get('/dashboard/stats', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), kotController.getKitchenDashboard);

// Delete KOT
router.delete('/:id', auth, authorize(['ADMIN']), kotController.deleteKOT);

module.exports = router;