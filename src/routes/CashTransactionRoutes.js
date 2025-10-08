const express = require('express');
const router = express.Router();
const {
  getCashAtReception,
  addCashTransaction,
  getAllCashTransactions
} = require('../controllers/cashTransactionController');

// 🧾 Get filtered cash summary (today, week, month, year, date, source)
router.get('/cash-at-reception', getCashAtReception);

// 📋 Get all cash transactions (unfiltered list)
router.get('/all-transactions', getAllCashTransactions);

// ➕ Add a new cash transaction
router.post('/add-transaction', addCashTransaction);

module.exports = router;
