const express = require('express');
const router = express.Router();
const disbursementController = require('../controllers/disbursementController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, disbursementController.createDisbursement);
router.get('/', authMiddleware, disbursementController.getAllDisbursements);
router.get('/kitchen-store', authMiddleware, disbursementController.getKitchenStore);
router.patch('/:id/status', authMiddleware, disbursementController.updateDisbursementStatus);

module.exports = router;