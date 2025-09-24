const express = require('express');
const router = express.Router();
const { getCashAtReception, addCashTransaction } = require('../controllers/cashTransactionController');


router.get('/cash-at-reception', getCashAtReception);

router.post('/add-transaction', addCashTransaction);

module.exports = router;
