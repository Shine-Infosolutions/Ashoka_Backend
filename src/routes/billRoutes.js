const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

router.post('/create', billController.createBill);
router.get('/all', billController.getAllBills);
router.patch('/:id/payment', billController.processPayment);
router.patch('/:id/split-payment', billController.processSplitPayment);

module.exports = router;
