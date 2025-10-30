const express = require('express');
const billController = require('../controllers/billController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware(['admin', 'restaurant']), billController.createBill);
router.patch('/:id/payment', authMiddleware(['admin', 'restaurant']), billController.processPayment);
router.get('/all', authMiddleware(['admin', 'restaurant']), billController.getAllBills);
router.get('/:id', authMiddleware(['admin', 'restaurant']), billController.getBillById);

module.exports = router;
