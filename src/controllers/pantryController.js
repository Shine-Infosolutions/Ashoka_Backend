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
    
    const order = new PantryOrder({
      ...req.body,
      orderedBy: req.user?.id || req.body.orderedBy
    });

    await order.save();

    // Populate both orderedBy and vendorId
    await order.populate([
      { path: "orderedBy", select: "username email" },
      { path: "vendorId", select: "name phone email" }
    ]);

    res.status(201).json({ success: true, order });
  } catch (error) {
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

    // ✅ If status is delivered or fulfilled → update stock
    if (["delivered", "fulfilled"].includes(status)) {
      order.deliveredAt = new Date();

      // Update pantry item stock
      for (const item of order.items) {
        await PantryItem.findByIdAndUpdate(item.itemId, {
          $inc: { stockQuantity: item.quantity }  // ✅ Add stock for fulfilled vendor delivery
        });
      }
    }

    await order.save();

    await order.populate([
      { path: "orderedBy", select: "username email" },
      { path: "vendorId", select: "name phone email" }
    ]);

    res.json({ success: true, order });
  } catch (error) {
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
// exports.generateLowStockInvoice = async (req, res) => {
//   try {
//     const lowStockItems = await PantryItem.find({ isLowStock: true }).sort({ name: 1 });

//     if (lowStockItems.length === 0) {
//       return res.status(404).json({ error: 'No low stock items found' });
//     }

//     const invoice = {
//       invoiceNumber: `LSI-${Date.now()}`,
//       generatedDate: new Date(),
//       generatedBy: req.user.id,
//       title: 'Low Stock Items Invoice',
//       items: lowStockItems.map(item => ({
//         name: item.name,
//         category: item.category,
//         currentStock: item.currentStock,
//         minStockLevel: item.minStockLevel,
//         unit: item.unit,
//         shortfall: item.minStockLevel - item.currentStock,
//         estimatedCost: item.estimatedCost || 0,
//         totalCost: (item.minStockLevel - item.currentStock) * (item.estimatedCost || 0)
//       })),
//       totalItems: lowStockItems.length,
//       totalEstimatedCost: lowStockItems.reduce((sum, item) =>
//         sum + ((item.minStockLevel - item.currentStock) * (item.estimatedCost || 0)), 0
//       )
//     };

//     res.json({ success: true, invoice });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.generateLowStockInvoice = async (req, res) => {
  try {
    const lowStockItems = await PantryItem.find({ 
      currentStock: { $lte: 20 }
    }).sort({ name: 1 });

    if (lowStockItems.length === 0) {
      return res.status(404).json({ error: "No low stock items found" });
    }

    const invoice = {
      invoiceNumber: `LSI-${Date.now()}`,
      generatedDate: new Date(),
      generatedBy: req.user.id,
      title: "Low Stock Items Invoice",
      items: lowStockItems.map((item) => ({
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        minStockLevel: 20,
        unit: item.unit,
        shortfall: Math.max(0, 20 - item.currentStock),
        estimatedCost: item.costPerUnit || 0,
        totalCost: Math.max(0, 20 - item.currentStock) * (item.costPerUnit || 0)
      })),
      totalItems: lowStockItems.length,
      totalEstimatedCost: lowStockItems.reduce(
        (sum, item) =>
          sum + (Math.max(0, 20 - item.currentStock) * (item.costPerUnit || 0)),
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
      { header: 'Order Type', key: 'orderType', width: 20 },
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
