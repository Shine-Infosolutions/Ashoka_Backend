const express = require('express');
const router = express.Router();
const disbursementController = require('../controllers/disbursementController');
const authMiddleware = require('../middleware/authMiddleware');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Disbursement routes working' });
});

router.post('/', disbursementController.createDisbursement);
router.get('/', authMiddleware, disbursementController.getAllDisbursements);
router.get('/kitchen-store', authMiddleware, disbursementController.getKitchenStore);
router.patch('/:id/status', authMiddleware, disbursementController.updateDisbursementStatus);

module.exports = router;