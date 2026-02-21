const express = require('express');
const router = express.Router();
const SplitBill = require('../models/SplitBill');
const { auth } = require('../middleware/auth');

router.get('/:orderId', auth, async (req, res) => {
  try {
    const splitBill = await SplitBill.findOne({ orderId: req.params.orderId });
    res.json({ splitBill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
