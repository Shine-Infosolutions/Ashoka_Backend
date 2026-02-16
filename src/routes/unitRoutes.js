const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');
const { auth, authorize } = require('../middleware/auth');

router.get('/all', auth, async (req, res) => {
  try {
    const units = await Unit.find({ isActive: true }).sort({ name: 1 });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching units', error: error.message });
  }
});

router.post('/add', auth, authorize('ADMIN', 'GM'), async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ message: 'Error creating unit', error: error.message });
  }
});

module.exports = router;
