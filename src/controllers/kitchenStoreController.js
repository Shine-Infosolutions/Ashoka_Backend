const KitchenStore = require('../models/KitchenStore');

// Get all kitchen store items
exports.getItems = async (req, res) => {
  try {
    const items = await KitchenStore.find().sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create kitchen store item
exports.createItem = async (req, res) => {
  try {
    const item = new KitchenStore(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update kitchen store item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await KitchenStore.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete kitchen store item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await KitchenStore.findByIdAndDelete(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};