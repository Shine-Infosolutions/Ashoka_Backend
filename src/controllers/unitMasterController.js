const Unit = require('../models/Unit');

exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.find({ isActive: true }).sort({ name: 1 });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching units', error: error.message });
  }
};
