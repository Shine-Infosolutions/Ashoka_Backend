const KitchenOrder = require('../models/KitchenOrder');

// Get all kitchen orders
const getAllKitchenOrders = async (req, res) => {
  try {
    const orders = await KitchenOrder.find()
      .populate('items.itemId', 'name unit')
      .populate('vendorId', 'name')
      .populate('fulfillment.fulfilledBy', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get kitchen order by ID
const getKitchenOrderById = async (req, res) => {
  try {
    const order = await KitchenOrder.findById(req.params.id)
      .populate('items.itemId', 'name unit')
      .populate('vendorId', 'name')
      .populate('fulfillment.fulfilledBy', 'name');
    if (!order) {
      return res.status(404).json({ message: 'Kitchen order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new kitchen order
const createKitchenOrder = async (req, res) => {
  try {
    const order = new KitchenOrder(req.body);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update kitchen order
const updateKitchenOrder = async (req, res) => {
  try {
    const order = await KitchenOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Kitchen order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete kitchen order
const deleteKitchenOrder = async (req, res) => {
  try {
    const order = await KitchenOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Kitchen order not found' });
    }
    res.json({ message: 'Kitchen order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  getAllKitchenOrders,
  getKitchenOrderById,
  createKitchenOrder,
  updateKitchenOrder,
  deleteKitchenOrder
};