const express = require('express');
const router = express.Router();
const LoyaltySettings = require('../models/LoyaltySettings');
const { auth } = require('../middleware/auth');

router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await LoyaltySettings.findOne();
    if (!settings) {
      settings = await LoyaltySettings.create({ redeemRate: 10, earnRate: 1 });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
