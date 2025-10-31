const PantryItem = require("../models/PantryItem");
const PantryOrder = require("../models/PantryOrder");
const ExcelJS = require('exceljs');

// Get all pantry items with category details
exports.getAllPantryItems = async (req, res) => {
  try {
    let items = await PantryItem.find()
      .populate("category", "name description") // populate category fields
      .sort({ name: 1 });

    // Calculate isLowStock
    items = items.map(item => {
      item = item.toObject(); // convert Mongoose doc to plain object
      item.isLowStock = item.stockQuantity <= 20;
      return item;
    });

    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get low stock pantry items
exports.getLowStockPantryItems = async (req, res) => {
  try {
    const items = await PantryItem.find({ stockQuantity: { $lte: 20 } })
      .populate("category", "name description")
      .sort({ name: 1 });

    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create pantry item with category details
exports.createPantryItem = async (req, res) => {
  try {
    const item = new PantryItem(req.body);
    await item.save();
    const populatedItem = await item.populate("category", "name description");
    res.status(201).json({ success: true, item: populatedItem });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update pantry item with category details
exports.updatePantryItem = async (req, res) => {
  try {
    let item = await PantryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!item) return res.status(404).json({ error: "Pantry item not found" });

    item = await item.populate("category", "name description");
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete pantry item
exports.deletePantryItem = async (req, res) => {
  try {
    const item = await PantryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Pantry item not found" });

    res.json({ success: true, message: "Pantry item deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create pantry order (kitchen to pantry or pantry to reception)
exports.createPantryOrder = async (req, res) => {
  try {
    // Check and drop the problematic orderNumber index if it exists
    try {
      const indexes = await PantryOrder.collection.indexes();
      const hasOrderNumberIndex = indexes.some(index => index.name === 'orderNumber_1');
      if (hasOrderNumberIndex) {
        await PantryOrder.collection.dropIndex('orderNumber_1');
        console.log('Dropped orderNumber_1 index');
      }
    } catch (e) {
      console.log('Index handling:', e.message);
    }
    
    // Validate stock availability for Pantry to Kitchen orders
    if (req.body.orderType === 'Pantry to Kitchen') {
      for (const item of req.body.items) {
        const pantryItem = await PantryItem.findById(item.itemId || item.pantryItemId);
        if (!pantryItem) {
          return res.status(404).json({ error: `Item ${item.itemId || item.pantryItemId} not found` });
        }
        if (pantryItem.stockQuantity < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${pantryItem.name}. Available: ${pantryItem.stockQuantity}, Requested: ${item.quantity}` 
          });
        }
      }
    }

    const orderData = {
      ...req.body,
      orderedBy: req.user?.id || req.body.orderedBy
    };

    // If order type is "Pantry to Kitchen", set initial status and handle kitchen store update
    if (req.body.orderType === 'Pantry to Kitchen') {
      orderData.status = 'fulfilled';
      orderData.deliveredAt = new Date();
      orderData.fulfillment = {
        fulfilledAt: new Date(),
        fulfilledBy: req.user?.id,
        notes: 'Automatically fulfilled - items sent to kitchen store'
      };
    }

    const order = new PantryOrder(orderData);
    await order.save();
    console.log('Pantry order saved:', order._id);

    // If order type is "Pantry to Kitchen", create corresponding kitchen order
    if (req.body.orderType === 'Pantry to Kitchen') {
      try {
        const KitchenOrder = require('../models/KitchenOrder');
        
        // Populate items to get item details
        await order.populate('items.itemId', 'name unit');
        
        // Create corresponding kitchen order
        const kitchenOrder = new KitchenOrder({
          items: order.items,
          totalAmount: order.totalAmount,
          status: 'delivered', // Items are directly delivered to kitchen
          orderType: 'pantry_to_kitchen',
          specialInstructions: order.specialInstructions,
          orderedBy: order.orderedBy,
          pantryOrderId: order._id,
          receivedAt: new Date()
        });
        
        await kitchenOrder.save();
        console.log('Kitchen order created:', kitchenOrder._id);
        
        // Reduce pantry item stock
        for (const item of order.items) {
          await PantryItem.findByIdAndUpdate(item.itemId, {
            $inc: { stockQuantity: -Number(item.quantity) }
          });
        }
        
        // Add items to kitchen store
        const KitchenStore = require('../models/KitchenStore');
        for (const orderItem of order.items) {
          let kitchenItem = await KitchenStore.findOne({ 
            name: orderItem.itemId.name 
          });
          
          if (kitchenItem) {
            kitchenItem.quantity = Number(kitchenItem.quantity) + Number(orderItem.quantity);
            await kitchenItem.save();
          } else {
            kitchenItem = new KitchenStore({
              name: orderItem.itemId.name,
              category: 'Food',
              quantity: Number(orderItem.quantity),
              unit: orderItem.itemId.unit || 'pcs'
            });
            await kitchenItem.save();
          }
        }
        
        console.log('Items added to kitchen store and kitchen order created');
      } catch (error) {
        console.error('Failed to create kitchen order:', error);
      }
    }

    // Populate both orderedBy and vendorId (skip if already populated)
    if (!order.populated('orderedBy')) {
      await order.populate([
        { path: "orderedBy", select: "username email" },
        { path: "vendorId", select: "name phone email" }
      ]);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('Create pantry order error:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get pantry orders
exports.getPantryOrders = async (req, res) => {
  try {
    const { orderType, status } = req.query;
    const filter = {};

    if (orderType) filter.orderType = orderType;
    if (status) filter.status = status;

    const orders = await PantryOrder.find(filter)
    .populate("orderedBy", "username email")
    .populate("vendorId", "name phone email") 
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update pantry order status
exports.updatePantryOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await PantryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;

    // If Kitchen to Pantry order is approved, reduce pantry stock and update kitchen order
    if (order.orderType === 'Kitchen to Pantry' && status === 'approved') {
      try {
        // Reduce pantry stock
        for (const item of order.items) {
          await PantryItem.findByIdAndUpdate(item.itemId, {
            $inc: { stockQuantity: -Number(item.quantity) }
          });
        }
        
        // Update linked kitchen order status to delivered
        if (order.kitchenOrderId) {
          const KitchenOrder = require('../models/KitchenOrder');
          await KitchenOrder.findByIdAndUpdate(order.kitchenOrderId, {
            status: 'delivered',
            receivedAt: new Date()
          });
          
          // Add items to kitchen store
          const KitchenStore = require('../models/KitchenStore');
          await order.populate('items.itemId', 'name unit');
          
          for (const orderItem of order.items) {
            let kitchenItem = await KitchenStore.findOne({ 
              name: orderItem.itemId.name 
            });
            
            if (kitchenItem) {
              kitchenItem.quantity = Number(kitchenItem.quantity) + Number(orderItem.quantity);
              await kitchenItem.save();
            } else {
              kitchenItem = new KitchenStore({
                name: orderItem.itemId.name,
                category: 'Food',
                quantity: Number(orderItem.quantity),
                unit: orderItem.itemId.unit || 'pcs'
              });
              await kitchenItem.save();
            }
          }
          
          console.log('Items added to kitchen store from pantry approval');
        }
        
        order.status = 'fulfilled';
        order.deliveredAt = new Date();
      } catch (error) {
        console.error('Failed to process kitchen to pantry approval:', error);
      }
    }

    // For vendor orders - add stock when delivered/fulfilled
    if (order.orderType !== 'Kitchen to Pantry' && ["delivered", "fulfilled"].includes(status)) {
      order.deliveredAt = new Date();
      for (const item of order.items) {
        await PantryItem.findByIdAndUpdate(item.itemId, {
          $inc: { stockQuantity: item.quantity }
        });
      }
    }

    await order.save();

    await order.populate([
      { path: "orderedBy", select: "username email" },
      { path: "vendorId", select: "name phone email" }
    ]);

    console.log(`Pantry order ${req.params.id} status updated to: ${status}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Update pantry order status error:', error);
    res.status(400).json({ error: error.message });
  }
};


// Update pantry item stock
exports.updatePantryStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    const item = await PantryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: "Pantry item not found" });
    }

    if (operation === "add") {
      item.currentStock += quantity;
    } else if (operation === "subtract") {
      item.currentStock = Math.max(0, item.currentStock - quantity);
    }

    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Generate invoice for low stock items
exports.generateLowStockInvoice = async (req, res) => {
  try {
    const lowStockItems = await PantryItem.find({ 
      stockQuantity: { $lte: 20 }
    }).sort({ name: 1 });

    if (lowStockItems.length === 0) {
      return res.status(404).json({ error: "No low stock items found" });
    }

    const invoice = {
      invoiceNumber: `LSI-${Date.now()}`,
      generatedDate: new Date(),
      generatedBy: req.user?.id || 'system',
      title: "Low Stock Items Invoice",
      items: lowStockItems.map((item) => ({
        name: item.name,
        category: item.category,
        currentStock: item.stockQuantity,
        minStockLevel: 20,
        unit: item.unit,
        shortfall: Math.max(0, 20 - item.stockQuantity),
        estimatedCost: item.costPerUnit || 0,
        totalCost: Math.max(0, 20 - item.stockQuantity) * (item.costPerUnit || 0)
      })),
      totalItems: lowStockItems.length,
      totalEstimatedCost: lowStockItems.reduce(
        (sum, item) =>
          sum + (Math.max(0, 20 - item.stockQuantity) * (item.costPerUnit || 0)),
        0
      )
    };
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a pantry order by ID
exports.deletePantryOrder = async (req, res) => {
  try {
    const order = await PantryOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Pantry order not found" });
    }

    res.json({ success: true, message: "Pantry order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate invoice for Reception to Vendor orders
exports.generateVendorInvoice = async (req, res) => {
  try {
    const vendorOrders = await PantryOrder.find({
      orderType: 'Reception to Vendor',
      status: { $in: ['pending', 'ready'] }
    })
    .populate('vendorId', 'name phone email')
    .populate('items.itemId', 'name unit costPerUnit')
    .populate('orderedBy', 'username email');

    if (!vendorOrders.length) {
      return res.status(404).json({ error: 'No Reception to Vendor orders found' });
    }

    const invoice = vendorOrders.map(order => ({
      orderNumber: order.orderNumber,
      vendor: order.vendorId ? {
        name: order.vendorId.name,
        phone: order.vendorId.phone,
        email: order.vendorId.email
      } : { name: "Unknown Vendor" },
      totalAmount: order.totalAmount,
      items: order.items.map(i => ({
        name: i.itemId?.name || "Deleted Item",
        quantity: i.quantity,
        unit: i.itemId?.unit || "",
        unitPrice: i.unitPrice,
        total: i.quantity * i.unitPrice
      })),
      specialInstructions: order.specialInstructions,
      orderedBy: order.orderedBy,
      createdAt: order.createdAt
    }));

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload pricing image for fulfillment
exports.uploadPricingImage = async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image || !image.base64) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const base64Data = image.base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const timestamp = Date.now();
    const filename = `pricing-${timestamp}-${image.name || 'image.jpg'}`;
    const filepath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    
    const imageUrl = `/uploads/${filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fulfill invoice with pricing image and amount tracking
exports.fulfillInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newAmount, pricingImage, chalanImage, notes } = req.body;

    const order = await PantryOrder.findById(orderId)
      .populate('vendorId', 'name phone email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }



    const previousAmount = order.totalAmount;
    const difference = newAmount - previousAmount;

    order.fulfillment = {
      previousAmount,
      newAmount,
      difference,
      pricingImage,
      chalanImage,
      fulfilledAt: new Date(),
      fulfilledBy: req.user?.id,
      notes
    };
    order.status = 'fulfilled';
    order.totalAmount = newAmount;

    await order.save();



    await order.populate([
      { path: 'orderedBy', select: 'username email' },
      { path: 'fulfillment.fulfilledBy', select: 'username email' }
    ]);

    res.json({ 
      success: true, 
      order,
      fulfillment: {
        previousAmount,
        newAmount,
        difference,
        message: difference > 0 ? 'Amount increased' : difference < 0 ? 'Amount decreased' : 'No change in amount'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get fulfillment history for an order
exports.getFulfillmentHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await PantryOrder.findById(orderId)
      .populate('fulfillment.fulfilledBy', 'username email')
      .populate('vendorId', 'name phone email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ 
      success: true, 
      fulfillment: order.fulfillment,
      orderDetails: {
        id: order._id,
        vendor: order.vendorId,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate Excel report for pantry orders with date range filter
exports.generatePantryOrdersExcel = async (req, res) => {
  try {
    const { startDate, endDate, orderType, status } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (orderType) filter.orderType = orderType;
    if (status) filter.status = status;

    const orders = await PantryOrder.find(filter)
      .populate('orderedBy', 'username email')
      .populate('vendorId', 'name phone email')
      .populate('items.itemId', 'name unit')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pantry Orders');

    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Order Type', key: 'orderType', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Ordered By', key: 'orderedBy', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Items', key: 'items', width: 40 },
      { header: 'Special Instructions', key: 'specialInstructions', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Delivered At', key: 'deliveredAt', width: 20 }
    ];

    orders.forEach(order => {
      const itemsText = order.items.map(item => 
        `${item.itemId?.name || 'Unknown'} (${item.quantity} ${item.itemId?.unit || ''})`
      ).join(', ');

      worksheet.addRow({
        orderId: order._id.toString(),
        orderType: order.orderType,
        status: order.status,
        totalAmount: order.totalAmount,
        orderedBy: order.orderedBy?.username || 'Unknown',
        vendor: order.vendorId?.name || 'N/A',
        items: itemsText,
        specialInstructions: order.specialInstructions || '',
        createdAt: order.createdAt.toLocaleDateString(),
        deliveredAt: order.deliveredAt ? order.deliveredAt.toLocaleDateString() : 'N/A'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=pantry-orders-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate Excel report for pantry items with date range filter
exports.generatePantryItemsExcel = async (req, res) => {
  try {
    const { startDate, endDate, category, lowStock } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (category) filter.category = category;
    if (lowStock === 'true') filter.stockQuantity = { $lte: 20 };

    const items = await PantryItem.find(filter)
      .populate('category', 'name description')
      .sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pantry Items');

    worksheet.columns = [
      { header: 'Item ID', key: 'itemId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Stock Quantity', key: 'stockQuantity', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Cost Per Unit', key: 'costPerUnit', width: 15 },
      { header: 'Low Stock', key: 'lowStock', width: 12 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    items.forEach(item => {
      worksheet.addRow({
        itemId: item._id.toString(),
        name: item.name,
        category: item.category?.name || 'N/A',
        stockQuantity: item.stockQuantity,
        unit: item.unit,
        costPerUnit: item.costPerUnit || 0,
        lowStock: item.stockQuantity <= 20 ? 'Yes' : 'No',
        description: item.description || '',
        createdAt: item.createdAt ? item.createdAt.toLocaleDateString() : 'N/A'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=pantry-items-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload chalan from store
exports.uploadChalan = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }
    const { orderId, image } = req.body;
    
    if (!image || !image.base64) {
      return res.status(400).json({ error: 'Chalan image is required' });
    }
    
    // Update order with chalan base64
    if (orderId) {
      await PantryOrder.findByIdAndUpdate(orderId, {
        chalanImage: image.base64,
        'fulfillment.chalanImage': image.base64
      });
    }
    
    res.json({ success: true, chalanUrl: image.base64 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Disburse items from store to kitchen
exports.disburseToKitchen = async (req, res) => {
  try {
    const { items, notes } = req.body;
    const Disbursement = require('../models/Disbursement');
    
    const disbursementData = {
      disbursementNumber: `DSB-${Date.now()}`,
      items: [],
      totalItems: 0,
      disbursedBy: req.user?.id,
      disbursedAt: new Date(),
      notes
    };

    for (const item of items) {
      const pantryItem = await PantryItem.findById(item.itemId);
      
      if (!pantryItem) {
        return res.status(404).json({ error: `Item ${item.itemId} not found` });
      }
      
      if (pantryItem.stockQuantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${pantryItem.name}. Available: ${pantryItem.stockQuantity}` 
        });
      }
      
      // Decrease pantry stock
      pantryItem.stockQuantity -= item.quantity;
      await pantryItem.save();
      
      disbursementData.items.push({
        itemId: item.itemId,
        itemName: pantryItem.name,
        quantity: item.quantity,
        unit: pantryItem.unit
      });
      
      disbursementData.totalItems += item.quantity;
    }

    // Save disbursement to database
    const disbursement = new Disbursement(disbursementData);
    await disbursement.save();

    res.json({ success: true, disbursement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get disbursement history
exports.getDisbursementHistory = async (req, res) => {
  try {
    const Disbursement = require('../models/Disbursement');
    
    const disbursements = await Disbursement.find()
      .populate('items.itemId', 'name unit')
      .populate('disbursedBy', 'username email')
      .sort({ disbursedAt: -1 });

    res.json({ success: true, disbursements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};