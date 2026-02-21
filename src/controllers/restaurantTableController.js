const RestaurantTable = require('../models/RestaurantTable');

exports.getAllTables = async (req, res) => {
  try {
    const tables = await RestaurantTable.find().sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location } = req.body;
    const table = new RestaurantTable({ tableNumber, capacity, location });
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body.status ? { status: req.body.status } : req.body;
    const table = await RestaurantTable.findByIdAndUpdate(id, updateData, { new: true });
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    await RestaurantTable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
