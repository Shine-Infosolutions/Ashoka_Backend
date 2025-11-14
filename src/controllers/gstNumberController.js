const GSTNumber = require('../models/GSTNumber');

// Create GST Number (Customer/Company)
const createGSTNumber = async (req, res) => {
  try {
    const { name, address, city, company, mobileNumber, gstNumber } = req.body;
    
    const gstNumberRecord = new GSTNumber({
      name,
      address,
      city,
      company,
      mobileNumber,
      gstNumber
    });
    
    await gstNumberRecord.save();
    res.status(201).json({ success: true, gstNumber: gstNumberRecord });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all GST Numbers
const getAllGSTNumbers = async (req, res) => {
  try {
    const gstNumbers = await GSTNumber.find();
    res.json({ success: true, gstNumbers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get GST Number by ID
const getGSTNumberById = async (req, res) => {
  try {
    const { id } = req.params;
    const gstNumber = await GSTNumber.findById(id);
    
    if (!gstNumber) {
      return res.status(404).json({ success: false, error: 'GST Number not found' });
    }
    
    res.json({ success: true, gstNumber });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get GST details by GST Number (auto-fill)
const getGSTDetails = async (req, res) => {
  try {
    const { gstNumber } = req.params;
    
    const existingGST = await GSTNumber.findOne({ gstNumber });
    if (!existingGST) {
      return res.status(404).json({ success: false, error: 'GST Number not found' });
    }
    
    res.json({ success: true, gstNumber: existingGST });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update GST Number
const updateGSTNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const gstNumber = await GSTNumber.findByIdAndUpdate(id, updates, { new: true });
    if (!gstNumber) {
      return res.status(404).json({ success: false, error: 'GST Number not found' });
    }
    
    res.json({ success: true, gstNumber });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete GST Number (soft delete)
const deleteGSTNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const gstNumber = await GSTNumber.findByIdAndDelete(id);
    
    if (!gstNumber) {
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
  getGSTDetails,
  updateGSTNumber,
  deleteGSTNumber
};