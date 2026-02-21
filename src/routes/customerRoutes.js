const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { phone } = req.query;
    const customers = await Customer.find({ phone: { $regex: phone, $options: 'i' } }).limit(10);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
