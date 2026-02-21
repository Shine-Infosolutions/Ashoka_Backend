const RestaurantOrder = require('../models/RestaurantOrder.js');
const MenuItem = require('../models/MenuItem.js');
const { createAuditLog } = require('../utils/auditLogger');
const mongoose = require('mongoose');



// Create new restaurant order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Populate item details from MenuItem collection
    const itemsWithDetails = await Promise.all(
      orderData.items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.itemId);
        if (!menuItem) throw new Error(`Menu item ${item.itemId} not found`);
        return {
          itemId: item.itemId,
          itemName: menuItem.name,
          quantity: item.quantity,
          price: menuItem.Price || menuItem.price || 0,
          isFree: item.isFree || false,
          nocId: item.nocId || null
        };
      })
    );
    
    orderData.items = itemsWithDetails;
    
    // Update table status to occupied
    if (orderData.tableNo) {
      const RestaurantTable = require('../models/RestaurantTable');
      await RestaurantTable.findOneAndUpdate(
        { tableNumber: orderData.tableNo },
        { status: 'occupied' }
      );
    }
    
    const order = new RestaurantOrder(orderData);
    await order.save();

    // Create audit log
    createAuditLog('CREATE', 'RESTAURANT_ORDER', order._id, req.user?.id, req.user?.role, null, order.toObject(), req);

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await RestaurantOrder.find()
      .sort({ createdAt: -1 })
      .populate('items.itemId', 'name price')
      .maxTimeMS(5000)
      .lean()
      .exec();
    res.json(orders);
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      res.status(408).json({ error: 'Database query timeout. Please try again.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get original data for audit log
    const originalOrder = await RestaurantOrder.findById(id);
    if (!originalOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = await RestaurantOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    // Create audit log
    createAuditLog('UPDATE', 'RESTAURANT_ORDER', order._id, req.user?.id, req.user?.role, originalOrder.toObject(), order.toObject(), req);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update restaurant order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get original data for audit log
    const originalOrder = await RestaurantOrder.findById(id);
    if (!originalOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = await RestaurantOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    // Create audit log
    createAuditLog('UPDATE', 'RESTAURANT_ORDER', order._id, req.user?.id, req.user?.role, originalOrder.toObject(), order.toObject(), req);
    
    // Also update corresponding KOT if items were updated
    if (updateData.items) {
      try {
        const KOT = require('../models/KOT');
        const kot = await KOT.findOne({ orderId: id });
        if (kot) {
          const originalKOT = kot.toObject();
          const kotItems = updateData.items.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            specialInstructions: item.note || ''
          }));
          const updatedKOT = await KOT.findByIdAndUpdate(kot._id, { items: kotItems }, { new: true });
          
          // Create audit log for KOT update
          createAuditLog('UPDATE', 'KOT', kot._id, req.user?.id, req.user?.role, originalKOT, updatedKOT.toObject(), req);
        }
      } catch (kotError) {
        console.error('Error updating KOT:', kotError);
      }
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Link existing restaurant orders to bookings
exports.linkOrdersToBookings = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    // Get all restaurant orders without booking links
    const unlinkedOrders = await RestaurantOrder.find({
      $or: [
        { bookingId: { $exists: false } },
        { bookingId: null },
        { grcNo: { $exists: false } },
        { grcNo: null }
      ]
    });
    
    let linkedCount = 0;
    
    for (const order of unlinkedOrders) {
      if (order.tableNo) {
        const booking = await Booking.findOne({
          roomNumber: { $regex: new RegExp(`(^|,)\\s*${order.tableNo}\\s*(,|$)`) },
          status: { $in: ['Booked', 'Checked In'] },
          isActive: true
        });
        
        if (booking) {
          await RestaurantOrder.findByIdAndUpdate(order._id, {
            bookingId: booking._id,
            grcNo: booking.grcNo,
            roomNumber: booking.roomNumber,
            guestName: booking.name,
            guestPhone: booking.mobileNo
          });
          linkedCount++;
        }
      }
    }
    
    res.json({
      success: true,
      message: `Linked ${linkedCount} restaurant orders to bookings`,
      linkedCount,
      totalUnlinked: unlinkedOrders.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await RestaurantOrder.findById(req.params.id)
      .populate('items.itemId', 'name price Price')
      .populate('items.nocId', 'name authorityType');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.transferTable = async (req, res) => {
  try {
    const { newTableNo, oldTableStatus } = req.body;
    const order = await RestaurantOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const RestaurantTable = require('../models/RestaurantTable');
    const oldTableNo = order.tableNo;
    
    // Update old table status
    if (oldTableNo) {
      await RestaurantTable.findOneAndUpdate(
        { tableNumber: oldTableNo },
        { status: oldTableStatus || 'available' }
      );
    }
    
    // Update new table to occupied
    await RestaurantTable.findOneAndUpdate(
      { tableNumber: newTableNo },
      { status: 'occupied' }
    );
    
    // Update order with new table
    order.tableNo = newTableNo;
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addItems = async (req, res) => {
  try {
    const { items } = req.body;
    const order = await RestaurantOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const MenuItem = require('../models/MenuItem');
    const newItems = await Promise.all(
      items.map(async (item) => {
        const menuItem = await MenuItem.findById(item.itemId);
        return {
          itemId: item.itemId,
          itemName: menuItem.name,
          quantity: item.quantity,
          price: menuItem.Price || menuItem.price || 0,
          isFree: false
        };
      })
    );
    
    order.items.push(...newItems);
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const order = await RestaurantOrder.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid', status: 'paid' },
      { new: true }
    );
    
    // Update table status to available when order is paid
    if (order && order.tableNo) {
      const RestaurantTable = require('../models/RestaurantTable');
      await RestaurantTable.findOneAndUpdate(
        { tableNumber: order.tableNo },
        { status: 'available' }
      );
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const order = await RestaurantOrder.findById(req.params.id)
      .populate('items.itemId', 'name price Price');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};