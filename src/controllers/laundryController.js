// controllers/laundryController.js
const Laundry = require("../models/Laundry");
const LaundryRate = require("../models/LaundryRate");
const Booking = require("../models/Booking");
const Invoice = require("../models/Invoice");


// 🔹 Helper → Unique Invoice Number generate
const generateInvoiceNumber = async () => {
  let invoiceNumber, exists = true;
  while (exists) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    invoiceNumber = `INV-${rand}`;
    exists = await Invoice.findOne({ invoiceNumber });
  }
  return invoiceNumber;
};


// — Helper: Calculate items total & lock itemName from rate table
const calculateItems = async (items) => {
  const rateIds = items.map(i => i.rateId);
  const rates = await LaundryRate.find({ _id: { $in: rateIds } });
  const rateMap = rates.reduce((acc, r) => {
    acc[r._id.toString()] = r;
    return acc;
  }, {});

  let total = 0;
  const processedItems = items.map(i => {
    const rateDoc = rateMap[i.rateId.toString()];
    if (!rateDoc) throw new Error(`Rate not found for ID: ${i.rateId}`);
    const calcAmount = rateDoc.rate * i.quantity;
    total += calcAmount;
    return {
      ...i,
      itemName: rateDoc.itemName,
      calculatedAmount: calcAmount
    };
  });

  return { processedItems, total };
};

// 🔹 Create Laundry Order
exports.createLaundryOrder = async (req, res) => {
  try {
    const { bookingId, items, urgent, grcNo, roomNumber, requestedByName, receivedBy } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    // Calculate total
    let totalAmount = 0;
    const laundryItems = [];

    for (const item of items) {
      const rate = await LaundryRate.findById(item.rateId);
      if (!rate) {
        return res.status(404).json({ error: "Invalid laundry rate" });
      }
      const calculatedAmount = rate.rate * item.quantity;
      totalAmount += calculatedAmount;

      laundryItems.push({
        itemName: rate.itemName,
        rateId: rate._id,
        quantity: item.quantity,
        calculatedAmount,
      });
    }

    // ✅ Save Laundry order with extra fields
    const laundryOrder = await Laundry.create({
      bookingId,
      grcNo,
      roomNumber,
      requestedByName,
      items: laundryItems,
      totalAmount,
      isUrgent: urgent || false, // ⚡ field ka naam match karo model se
      billStatus: "unpaid",
    });

    // ✅ Create Invoice
    const invoiceNumber = await generateInvoiceNumber();
    const invoiceItems = laundryItems.map(i => ({
      description: `${i.itemName} x ${i.quantity}`,
      amount: i.calculatedAmount,
    }));

    await Invoice.create({
      serviceType: "Laundry",
      serviceRefId: laundryOrder._id,
      invoiceNumber,
      bookingId,
      items: invoiceItems,
      subTotal: totalAmount,
      tax: 0,
      discount: 0,
      totalAmount: totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      status: "Unpaid",
    });

    res.status(201).json({
      message: "Laundry order created successfully with invoice",
      laundryOrder,
      totalAmount,
    });
  } catch (err) {
    console.error("Laundry order error:", err);
    res.status(500).json({ error: err.message });
  }
};

// — Get All Orders
exports.getAllLaundryOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.urgent === "true") filter.isUrgent = true;

    const orders = await Laundry.find(filter)
      .populate("bookingId", "guestName roomNumber checkInDate checkOutDate")
      .populate("items.rateId");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Get By ID
exports.getLaundryById = async (req, res) => {
  try {
    const order = await Laundry.findById(req.params.id)
      .populate("bookingId", "guestName roomNumber checkInDate checkOutDate")
      .populate("items.rateId");

    if (!order) return res.status(404).json({ message: "Laundry order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Update Laundry Order Status
exports.updateLaundryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Allowed statuses based on schema
    const allowedStatuses = [
      "pending",             // order created
      "in_progress",         // washing/dry-cleaning started
      "partially_delivered", // kuch items return ho gaye
      "completed",           // sab items delivered ho gaye
      "cancelled"            // cancelled order
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`
      });
    }

    const order = await Laundry.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Laundry order not found" });
    }

    order.laundryStatus = status;

    // auto set deliveredTime agar status "completed" hua
    if (status === "completed") {
      order.deliveredTime = new Date();
      order.isReturned = true;
    }

    // auto mark as cancelled
    if (status === "cancelled") {
      order.isCancelled = true;
    }

    await order.save();

    res.json({
      message: `Laundry order status updated to '${status}'`,
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// — Get Laundry by GRC No or Room Number
exports.getLaundryByGRCOrRoom = async (req, res) => {
  try {
    const { grcNo, roomNumber } = req.query;
    if (!grcNo && !roomNumber) {
      return res.status(400).json({ message: "Please provide GRC No or Room Number" });
    }
    const query = {};
    if (grcNo) query.grcNo = grcNo;
    if (roomNumber) query.roomNumber = roomNumber;

    const orders = await Laundry.find(query)
      .populate("bookingId", "guestName checkInDate checkOutDate")
      .populate("items.rateId");
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Update single item status/notes
exports.updateLaundryItemStatus = async (req, res) => {
  try {
    const { status, itemNotes } = req.body;
    const { laundryId, itemId } = req.params;

    const order = await Laundry.findById(laundryId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (status) item.status = status;
    if (itemNotes) item.itemNotes = itemNotes;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Update Entire Order
exports.updateLaundryOrder = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.items?.length) {
      const { processedItems, total } = await calculateItems(req.body.items);
      updateData.items = processedItems;
      updateData.totalAmount = total;
    }

    const updatedOrder = await Laundry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("items.rateId");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Laundry order not found" });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Add Items
exports.addItemsToLaundryOrder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items?.length) return res.status(400).json({ message: "Items are required" });

    const laundryOrder = await Laundry.findById(req.params.id);
    if (!laundryOrder) return res.status(404).json({ message: "Order not found" });

    const { processedItems, total } = await calculateItems(items);

    laundryOrder.items.push(...processedItems);
    laundryOrder.totalAmount += total;
    await laundryOrder.save();

    res.json(laundryOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Cancel Order
exports.cancelLaundryOrder = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndUpdate(
      req.params.id,
      { isCancelled: true, laundryStatus: "cancelled" },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Mark Returned
exports.markLaundryReturned = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndUpdate(
      req.params.id,
      { isReturned: true },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Report Damage/Loss
exports.reportDamageOrLoss = async (req, res) => {
  try {
    const { damageReported, damageNotes, isLost, lossNote } = req.body;
    const order = await Laundry.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (typeof damageReported !== "undefined") order.damageReported = damageReported;
    if (damageNotes) order.damageNotes = damageNotes;
    if (typeof isLost !== "undefined") order.isLost = isLost;
    if (lossNote) order.lossNote = lossNote;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// — Get Laundry orders filtered by date range for a specific date field
exports.filterLaundryByDate = async (req, res) => {
  try {
    const { startDate, endDate, dateField } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Please provide both startDate and endDate in ISO format (YYYY-MM-DD)" });
    }

    // Allowed fields for date filtering (add more if needed)
    const allowedDateFields = [
      "createdAt",
      "scheduledPickupTime",
      "scheduledDeliveryTime",
      "pickupTime",
      "deliveredTime",
      "foundDate",
      "lostDate"
    ];

    const field = allowedDateFields.includes(dateField) ? dateField : "createdAt";

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Include whole end day
    end.setHours(23, 59, 59, 999);

    // Build dynamic query
    const query = {
      [field]: { $gte: start, $lte: end }
    };

    const orders = await Laundry.find(query)
      .populate("bookingId", "guestName roomNumber checkInDate checkOutDate")
      .populate("items.rateId");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// — Delete Order
exports.deleteLaundry = async (req, res) => {
  try {
    await Laundry.findByIdAndDelete(req.params.id);
    res.json({ message: "Laundry order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
