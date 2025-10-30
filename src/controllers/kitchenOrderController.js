const KitchenOrder = require('../models/KitchenOrder');

// Get all kitchen orders
const getAllKitchenOrders = async (req, res) => {
  try {
    const orders = await KitchenOrder.find()
      .populate('items.itemId', 'name unit')
      .populate('vendorId', 'name');
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
      .populate('vendorId', 'name');
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
    // Set receivedAt timestamp when status is 'delivered'
    const updateData = { ...req.body };
    if (req.body.status === 'delivered') {
      updateData.receivedAt = new Date();
    }
    
    const order = await KitchenOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('items.itemId', 'name unit');
    if (!order) {
      return res.status(404).json({ message: 'Kitchen order not found' });
    }

    // Update kitchen store when items are received
    if (req.body.status === 'delivered' && order.items && order.items.length > 0) {
      try {
        const KitchenStore = require('../models/KitchenStore');
        
        for (const orderItem of order.items) {
          // Find existing kitchen store item by name
          let kitchenItem = await KitchenStore.findOne({ 
            name: orderItem.itemId.name 
          });
          
          if (kitchenItem) {
            // Update existing item quantity (ensure numeric addition)
            kitchenItem.quantity = Number(kitchenItem.quantity) + Number(orderItem.quantity);
            await kitchenItem.save();
            console.log(`Updated kitchen store: ${kitchenItem.name} +${orderItem.quantity} = ${kitchenItem.quantity}`);
          } else {
            // Create new kitchen store item
            kitchenItem = new KitchenStore({
              name: orderItem.itemId.name,
              category: 'Food',
              quantity: Number(orderItem.quantity),
              unit: orderItem.itemId.unit || 'pcs'
            });
            await kitchenItem.save();
            console.log(`Created new kitchen store item: ${kitchenItem.name} with ${orderItem.quantity} ${kitchenItem.unit}`);
          }
        }
      } catch (kitchenStoreError) {
        console.error('Failed to update kitchen store:', kitchenStoreError.message);
      }
    }

    // Sync pantry order status when kitchen order status changes
    if (order.orderType === 'pantry_to_kitchen' && order.pantryOrderId && req.body.status) {
      try {
        const PantryOrder = require('../models/PantryOrder');
        let pantryStatus = req.body.status;
        
        // Map kitchen status to appropriate pantry status
        if (req.body.status === 'approved') {
          pantryStatus = 'approved';
        } else if (req.body.status === 'delivered') {
          pantryStatus = 'delivered'; // Kitchen received the items
        } else if (req.body.status === 'preparing') {
          pantryStatus = 'preparing';
        } else if (req.body.status === 'ready') {
          pantryStatus = 'ready';
        }
        
        const updatedPantryOrder = await PantryOrder.findByIdAndUpdate(
          order.pantryOrderId,
          { status: pantryStatus },
          { new: true }
        );
        
        if (updatedPantryOrder) {
          console.log(`Pantry order ${updatedPantryOrder._id} status updated to: ${pantryStatus}`);
        } else {
          console.log(`Pantry order ${order.pantryOrderId} not found`);
        }
      } catch (pantryError) {
        console.error('Failed to update pantry order status:', pantryError.message);
      }
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