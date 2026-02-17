const NOC = require('../models/NOC');

// Get all NOCs
exports.getAllNOCs = async (req, res) => {
  try {
    const nocs = await NOC.find({ isActive: true }).sort({ name: 1 });
    res.json(nocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create NOC
exports.createNOC = async (req, res) => {
  try {
    const noc = new NOC(req.body);
    await noc.save();
    res.status(201).json(noc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update NOC
exports.updateNOC = async (req, res) => {
  try {
    const noc = await NOC.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!noc) return res.status(404).json({ error: 'NOC not found' });
    res.json(noc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete NOC
exports.deleteNOC = async (req, res) => {
  try {
    const noc = await NOC.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!noc) return res.status(404).json({ error: 'NOC not found' });
    res.json({ message: 'NOC deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
