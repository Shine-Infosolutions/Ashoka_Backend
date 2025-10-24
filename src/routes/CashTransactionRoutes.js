const express = require('express');
const router = express.Router();
const {
  getCashAtReception,
  addCashTransaction,
  getAllCashTransactions,
  generateCashTransactionsExcel
} = require('../controllers/cashTransactionController');

// 🧾 Get filtered cash summary (today, week, month, year, date, source)
router.get('/cash-at-reception', getCashAtReception);

// 📋 Get all cash transactions (unfiltered list)
router.get('/all-transactions', getAllCashTransactions);

// ➕ Add a new cash transaction
router.post('/add-transaction', addCashTransaction);

// 📊 Generate Excel report for cash transactions
router.get('/excel-report', generateCashTransactionsExcel);

module.exports = router;
