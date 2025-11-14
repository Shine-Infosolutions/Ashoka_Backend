const GST = require('../models/GST');
const axios = require('axios');

// Create GST
const createGST = async (req, res) => {
  try {
    const { totalGST, cgst, sgst, name, address, city, company, mobileNumber, gstNumber } = req.body;
    
    const gst = new GST({
      totalGST,
      cgst,
      sgst,
      name,
      address,
      city,
      company,
      mobileNumber,
      gstNumber
    });
    
    await gst.save();
    res.status(201).json({ success: true, gst });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all GSTs
const getAllGSTs = async (req, res) => {
  try {
    const gsts = await GST.find({ isActive: true });
    res.json({ success: true, gsts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get GST by ID
const getGSTById = async (req, res) => {
  try {
    const { id } = req.params;
    const gst = await GST.findById(id);
    
    if (!gst) {
      return res.status(404).json({ success: false, error: 'GST not found' });
    }
    
    res.json({ success: true, gst });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get GST details by GST Number (auto-fill)
const getGSTDetails = async (req, res) => {
  try {
    const { gstNumber } = req.params;
    
    const existingGST = await GST.findOne({ gstNumber, isActive: true });
    if (!existingGST) {
      return res.status(404).json({ success: false, error: 'GST not found' });
    }
    
    res.json({ success: true, gst: existingGST });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update GST
const updateGST = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const gst = await GST.findByIdAndUpdate(id, updates, { new: true });
    if (!gst) {
      return res.status(404).json({ success: false, error: 'GST not found' });
    }
    
    res.json({ success: true, gst });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete GST (soft delete)
const deleteGST = async (req, res) => {
  try {
    const { id } = req.params;
    const gst = await GST.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    if (!gst) {
      return res.status(404).json({ success: false, error: 'GST not found' });
    }
    
    res.json({ success: true, message: 'GST deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createGST,
  getAllGSTs,
  getGSTById,
  getGSTDetails,
  updateGST,
  deleteGST
};