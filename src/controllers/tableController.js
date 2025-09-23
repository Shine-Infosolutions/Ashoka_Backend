const Table = require('../models/Table');
const RestaurantOrder = require('../models/RestaurantOrder');

// Get all tables
exports.getAllTables = async (req, res) => {
  try {
    const { location, status } = req.query;
    const filter = {};
    
    if (location) filter.location = location;
    if (status) filter.status = status;
    
    const tables = await Table.find(filter).sort({ tableNumber: 1 });
    
    // Get tables with active orders
    const activeOrders = await RestaurantOrder.find({
      status: { $nin: ['completed', 'cancelled'] }
    }).distinct('tableNo');
    
    // Filter out tables with active orders
    const availableTables = tables.filter(table => 
      !activeOrders.includes(table.tableNumber)
    );
    
    res.json({ success: true, tables: availableTables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create table
exports.createTable = async (req, res) => {
  try {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json({ success: true, table });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update table
exports.updateTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findByIdAndUpdate(tableId, req.body, { new: true });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json({ success: true, table });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update table status
exports.updateTableStatus = async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;
    
    const table = await Table.findByIdAndUpdate(
      tableId,
      { status },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json({ success: true, table });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete table
exports.deleteTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await Table.findByIdAndDelete(tableId);
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};