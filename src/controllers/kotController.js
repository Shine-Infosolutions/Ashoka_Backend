const KOT = require('../models/KOT');
const RestaurantOrder = require('../models/RestaurantOrder');
const Item = require('../models/Items');
const Notification = require('../models/Notification');

// Generate KOT number
const generateKOTNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await KOT.countDocuments({
    createdAt: {
      $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    }
  });
  return `KOT${dateStr}${String(count + 1).padStart(3, '0')}`;
};

// Create KOT from order
exports.createKOT = async (req, res) => {
  try {
    const { orderId, items, priority, estimatedTime, specialInstructions } = req.body;
    
    const order = await RestaurantOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const kotNumber = await generateKOTNumber();
    
    // Get item details
    const kotItems = await Promise.all(items.map(async (item) => {
      const itemDetails = await Item.findById(item.itemId);
      return {
        itemId: item.itemId,
        itemName: itemDetails?.name || 'Unknown Item',
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || specialInstructions
      };
    }));
    
    const kot = new KOT({
      orderId,
      kotNumber,
      tableNo: order.tableNo,
      items: kotItems,
      priority: priority || 'normal',
      estimatedTime,
      createdBy: req.user?._id
    });
    
    await kot.save();
    
    // 🔥 WebSocket: Emit new KOT event
    const io = req.app.get('io');
    if (io) {
      io.to('waiters').emit('new-kot', {
        kot,
        tableNo: order.tableNo,
        itemCount: kotItems.length
      });
    }
    
    res.status(201).json(kot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all KOTs
exports.getAllKOTs = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const kots = await KOT.find(filter)
      .populate('items.itemId', 'name')
      .populate('createdBy', 'username')
      .populate('assignedChef', 'username')
      .sort({ createdAt: -1 });
    res.json(kots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update KOT status
exports.updateKOTStatus = async (req, res) => {
  try {
    const { status, actualTime, assignedChef } = req.body;
    const updates = { status };
    
    if (actualTime) updates.actualTime = actualTime;
    if (assignedChef) updates.assignedChef = assignedChef;
    
    const kot = await KOT.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('items.itemId', 'name')
      .populate('createdBy', 'username')
      .populate('assignedChef', 'username');
    if (!kot) return res.status(404).json({ error: 'KOT not found' });
    
    // 🔥 WebSocket: Emit KOT status update
    const io = req.app.get('io');
    if (io) {
      io.to('waiters').emit('kot-status-updated', {
        kotId: kot._id,
        orderId: kot.orderId,
        status: kot.status,
        tableNo: kot.tableNo
      });
    }
    
    // Send notification when order is marked as served
    if (status === 'served') {
      const order = await RestaurantOrder.findById(kot.orderId).populate('createdBy');
      
      if (order && order.createdBy) {
        const notification = new Notification({
          recipient: order.createdBy._id,
          message: `Order for Table ${kot.tableNo} is ready for serving`,
          type: 'order_ready',
          orderId: kot.orderId,
          kotId: kot._id,
          tableNo: kot.tableNo
        });
        await notification.save();
      }
    }
    
    res.json(kot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get KOT by ID
exports.getKOTById = async (req, res) => {
  try {
    const kot = await KOT.findById(req.params.id)
      .populate('orderId')
      .populate('items.itemId', 'name Price')
      .populate('createdBy', 'username')
      .populate('assignedChef', 'username');
    if (!kot) return res.status(404).json({ error: 'KOT not found' });
    res.json(kot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update item statuses
exports.updateItemStatuses = async (req, res) => {
  try {
    const { itemStatuses } = req.body;
    
    if (!Array.isArray(itemStatuses)) {
      return res.status(400).json({ error: 'itemStatuses must be an array' });
    }
    
    const kot = await KOT.findById(req.params.kotId);
    if (!kot) return res.status(404).json({ error: 'KOT not found' });
    
    // Update or add item statuses
    itemStatuses.forEach(({ itemIndex, status }) => {
      const existingIndex = kot.itemStatuses.findIndex(item => item.itemIndex === itemIndex);
      
      if (existingIndex >= 0) {
        kot.itemStatuses[existingIndex].status = status;
        kot.itemStatuses[existingIndex].checkedAt = new Date();
      } else {
        kot.itemStatuses.push({ itemIndex, status, checkedAt: new Date() });
      }
    });
    
    await kot.save();
    
    // WebSocket: Emit item status update
    const io = req.app.get('io');
    if (io) {
      io.to('waiters').emit('kot-item-status-updated', {
        kotId: kot._id,
        itemStatuses: kot.itemStatuses,
        tableNo: kot.tableNo
      });
    }
    
    res.json({ itemStatuses: kot.itemStatuses });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update KOT
exports.updateKOT = async (req, res) => {
  try {
    const kot = await KOT.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('items.itemId', 'name')
      .populate('createdBy', 'username')
      .populate('assignedChef', 'username');
    if (!kot) return res.status(404).json({ error: 'KOT not found' });
    res.json(kot);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create KOT automatically when order is created
exports.createKOTFromOrder = async (orderId) => {
  try {
    const order = await RestaurantOrder.findById(orderId).populate('items.itemId');
    if (!order) return null;
    
    const kotNumber = await generateKOTNumber();
    
    const kotItems = order.items.map(item => ({
      itemId: item.itemId._id,
      itemName: item.itemId.name,
      quantity: item.quantity,
      specialInstructions: ''
    }));
    
    const kot = new KOT({
      orderId: order._id,
      kotNumber,
      tableNo: order.tableNo,
      items: kotItems,
      priority: 'normal',
      createdBy: order.createdBy
    });
    
    await kot.save();
    return kot;
  } catch (error) {
    console.error('Error creating KOT from order:', error);
    return null;
  }
};