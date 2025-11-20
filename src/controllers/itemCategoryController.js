const ItemCategory = require('../models/ItemCategory.js');

// Create a new item category
exports.createItemCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const itemCategory = new ItemCategory({ name, isActive });
    await itemCategory.save();
    res.status(201).json(itemCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all item categories
exports.getItemCategories = async (req, res) => {
  try {
    const itemCategories = await ItemCategory.find();
    res.json(itemCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get an item category by ID
exports.getItemCategoryById = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findById(req.params.id);
    if (!itemCategory) return res.status(404).json({ error: 'Item category not found' });
    res.json(itemCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an item category
exports.updateItemCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const itemCategory = await ItemCategory.findByIdAndUpdate(
      req.params.id,
      { name, isActive },
      { new: true, runValidators: true }
    );
    if (!itemCategory) return res.status(404).json({ error: 'Item category not found' });
    res.json(itemCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete an item category
exports.deleteItemCategory = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findByIdAndDelete(req.params.id);
    if (!itemCategory) return res.status(404).json({ error: 'Item category not found' });
    res.json({ message: 'Item category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};