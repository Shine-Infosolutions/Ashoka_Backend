const KOT = require('../models/KOT');
const RestaurantOrder = require('../models/RestaurantOrder');

// Create KOT from order
const createKOT = async (req, res) => {
  try {
    const { orderId, items, tableNumber, notes, priority } = req.body;
    
    // Get order details
    const order = await RestaurantOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Create KOT
    const kot = new KOT({
      orderId,
      orderNumber: order.orderNumber,
      items: items || order.items,
      tableNumber: tableNumber || order.tableNumber || order.tableNo,
      customerName: order.customerName,
      priority: priority || 'NORMAL',
      notes,
      printedAt: new Date()
    });
    
    await kot.save();
    
    res.status(201).json({
      message: 'KOT created successfully',
      kot
    });
  } catch (error) {
    console.error('Create KOT error:', error);
    res.status(500).json({ error: 'Failed to create KOT' });
  }
};

// Get all KOTs
const getKOTs = async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const kots = await KOT.find(filter)
      .sort({ createdAt: -1 })
      .populate('orderId');
    
    res.json({ kots });
  } catch (error) {
    console.error('Get KOTs error:', error);
    res.status(500).json({ error: 'Failed to fetch KOTs' });
  }
};

// Get KOT by ID
const getKOTById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kot = await KOT.findById(id).populate('orderId');
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json({ kot });
  } catch (error) {
    console.error('Get KOT by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch KOT' });
  }
};

// Update KOT status
const updateKOTStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const allowedStatuses = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'PAID'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid KOT status' });
    }
    
    const kot = await KOT.findById(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    kot.status = status;
    const savedKOT = await kot.save();

    // Update associated order status
    try {
      const order = await RestaurantOrder.findById(kot.orderId);
      if (order) {
        order.status = status;
        await order.save();
      }
    } catch (orderError) {
      console.error('Order status sync error:', orderError);
    }
    
    res.json({
      message: 'KOT status updated successfully',
      kot: savedKOT
    });
  } catch (error) {
    console.error('Update KOT status error:', error);
    res.status(500).json({ error: 'Failed to update KOT status' });
  }
};

// Update KOT priority
const updateKOTPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    const kot = await KOT.findById(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    kot.priority = priority;
    const savedKOT = await kot.save();
    
    // Sync priority with associated order
    if (kot.orderId) {
      const order = await RestaurantOrder.findById(kot.orderId);
      if (order) {
        order.priority = priority;
        await order.save();
      }
    }
    
    res.json({
      message: 'KOT priority updated successfully',
      kot: savedKOT
    });
  } catch (error) {
    console.error('Update KOT priority error:', error);
    res.status(500).json({ error: 'Failed to update KOT priority' });
  }
};

// Print KOT
const printKOT = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kot = await KOT.findById(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    // Prepare data for printing
    const printData = {
      restaurantName: req.user?.restaurantName || 'Restaurant',
      orderNumber: kot.orderNumber,
      kotNumber: kot.kotNumber,
      items: kot.items,
      tableNumber: kot.tableNumber,
      customerName: kot.customerName,
      priority: kot.priority,
      notes: kot.notes,
      createdAt: kot.createdAt
    };
    
    // Update printed timestamp
    kot.printedAt = new Date();
    await kot.save();
    
    res.json({
      message: 'KOT printed successfully',
      printData
    });
  } catch (error) {
    console.error('Print KOT error:', error);
    res.status(500).json({ error: 'Failed to print KOT' });
  }
};

// Get kitchen dashboard data
const getKitchenDashboard = async (req, res) => {
  try {
    const [pendingKOTs, inProgressKOTs, completedToday] = await Promise.all([
      KOT.countDocuments({ status: 'PENDING' }),
      KOT.countDocuments({ status: 'PREPARING' }),
      KOT.countDocuments({
        status: 'SERVED',
        updatedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);
    
    const recentKOTs = await KOT.find({
      status: { $in: ['PENDING', 'PREPARING'] }
    })
    .sort({ priority: -1, createdAt: 1 })
    .limit(10);
    
    res.json({
      dashboard: {
        pendingKOTs,
        inProgressKOTs,
        completedToday,
        recentKOTs
      }
    });
  } catch (error) {
    console.error('Get kitchen dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen dashboard data' });
  }
};

// Delete KOT
const deleteKOT = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kot = await KOT.findByIdAndDelete(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json({ message: 'KOT deleted successfully' });
  } catch (error) {
    console.error('Delete KOT error:', error);
    res.status(500).json({ error: 'Failed to delete KOT' });
  }
};

// Update individual item status in KOT
const updateKOTItemStatus = async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const { status, isExtraItem } = req.body;
    
    const kot = await KOT.findById(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    const itemArray = isExtraItem ? kot.extraItems : kot.items;
    if (!itemArray || !itemArray[itemIndex]) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    itemArray[itemIndex].status = status;
    if (status === 'PREPARING') {
      if (!itemArray[itemIndex].startedAt) {
        itemArray[itemIndex].startedAt = new Date();
      }
    }
    if (status === 'READY') {
      if (!itemArray[itemIndex].startedAt) {
        itemArray[itemIndex].startedAt = new Date(Date.now() - 60000);
      }
      itemArray[itemIndex].readyAt = new Date();
      const seconds = Math.round((itemArray[itemIndex].readyAt - itemArray[itemIndex].startedAt) / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      itemArray[itemIndex].actualPrepTime = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    if (isExtraItem) {
      kot.markModified('extraItems');
    } else {
      kot.markModified('items');
    }
    await kot.save();

    // Sync to order
    try {
      const order = await RestaurantOrder.findById(kot.orderId);
      if (order) {
        const orderItemArray = isExtraItem ? order.extraItems : order.items;
        if (orderItemArray && orderItemArray[itemIndex]) {
          orderItemArray[itemIndex].status = status;
          if (itemArray[itemIndex].startedAt) {
            orderItemArray[itemIndex].startedAt = itemArray[itemIndex].startedAt;
          }
          if (itemArray[itemIndex].readyAt) {
            orderItemArray[itemIndex].readyAt = itemArray[itemIndex].readyAt;
            orderItemArray[itemIndex].actualPrepTime = itemArray[itemIndex].actualPrepTime;
          }
          if (isExtraItem) {
            order.markModified('extraItems');
          } else {
            order.markModified('items');
          }
          
          // Check if all items are served, then update order status to READY
          const allItems = [...(order.items || []), ...(order.extraItems || [])];
          const allServed = allItems.length > 0 && allItems.every(item => item.status === 'SERVED');
          if (allServed && order.status !== 'READY') {
            order.status = 'READY';
          }
          
          await order.save();
        }
      }
    } catch (orderError) {
      // Silent fail for order sync
      console.error('Order sync error:', orderError);
    }

    res.json({ message: 'Item status updated successfully', kot });
  } catch (error) {
    console.error('Update KOT item status error:', error);
    res.status(500).json({ error: 'Failed to update item status', details: error.message });
  }
};

// Get all KOTs (legacy support)
const getAllKOTs = async (req, res) => {
  return getKOTs(req, res);
};

// Update item statuses (legacy support)
const updateItemStatuses = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemStatuses } = req.body;
    
    const kot = await KOT.findById(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    // Update item statuses
    if (itemStatuses && Array.isArray(itemStatuses)) {
      itemStatuses.forEach(({ itemIndex, status }) => {
        if (kot.items[itemIndex]) {
          kot.items[itemIndex].status = status;
        }
      });
      kot.markModified('items');
      await kot.save();
    }
    
    res.json({ message: 'Item statuses updated successfully', kot });
  } catch (error) {
    console.error('Update item statuses error:', error);
    res.status(500).json({ error: 'Failed to update item statuses' });
  }
};

module.exports = {
  createKOT,
  getAllKOTs,
  getKOTs,
  getKOTById,
  updateKOTStatus,
  updateItemStatuses,
  updateKOTPriority,
  printKOT,
  getKitchenDashboard,
  deleteKOT,
  updateKOTItemStatus
};
