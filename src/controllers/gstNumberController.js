const GSTNumber = require('../models/GSTNumber');

// Create GST Number
const createGSTNumber = async (req, res) => {
  try {
    const { gstNumber, companyName } = req.body;
    
    const gst = new GSTNumber({
      gstNumber,
      companyName
    });
    
    await gst.save();
    res.status(201).json({ success: true, gst });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all GST Numbers
const getAllGSTNumbers = async (req, res) => {
  try {
    const gstNumbers = await GSTNumber.find({ isActive: true });
    res.json({ success: true, gstNumbers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get GST Number by ID
const getGSTNumberById = async (req, res) => {
  try {
    const { id } = req.params;
    const gst = await GSTNumber.findById(id);
    
    if (!gst) {
      return res.status(404).json({ success: false, error: 'GST Number not found' });
    }
    
    res.json({ success: true, gst });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update GST Number
const updateGSTNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const gst = await GSTNumber.findByIdAndUpdate(id, updates, { new: true });
    if (!gst) {
      return res.status(404).json({ success: false, error: 'GST Number not found' });
    }
    
    res.json({ success: true, gst });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete GST Number
const deleteGSTNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const gst = await GSTNumber.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    if (!gst) {
      return res.status(404).json({ success: false, error: 'GST Number not found' });
    }
    
    res.json({ success: true, message: 'GST Number deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createGSTNumber,
  getAllGSTNumbers,
  getGSTNumberById,
  updateGSTNumber,
  deleteGSTNumber
};