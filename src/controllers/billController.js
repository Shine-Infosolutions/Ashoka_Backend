const Bill = require('../models/Bill');
const RestaurantOrder = require('../models/RestaurantOrder');

// Generate bill number
const generateBillNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Bill.countDocuments({
    createdAt: {
      $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    }
  });
  return `BILL${dateStr}${String(count + 1).padStart(4, '0')}`;
};

// Create bill from order
exports.createBill = async (req, res) => {
  try {
    const { orderId, discount, tax, paymentMethod } = req.body;
    
    const order = await RestaurantOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const billNumber = await generateBillNumber();
    const subtotal = order.amount;
    const discountAmount = discount || 0;
    const taxAmount = tax || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;
    
    const bill = new Bill({
      orderId,
      billNumber,
      tableNo: order.tableNo,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      totalAmount,
      paymentMethod,
      cashierId: req.user?.id || req.user?._id
    });
    
    await bill.save();
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { paidAmount, paymentMethod } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    
    const changeAmount = paidAmount > bill.totalAmount ? paidAmount - bill.totalAmount : 0;
    const paymentStatus = paidAmount >= bill.totalAmount ? 'paid' : 'pending';
    
    bill.paidAmount = paidAmount;
    bill.changeAmount = changeAmount;
    bill.paymentStatus = paymentStatus;
    bill.paymentMethod = paymentMethod;
    
    await bill.save();
    
    // Update order status to completed if fully paid
    if (paymentStatus === 'paid') {
      await RestaurantOrder.findByIdAndUpdate(bill.orderId, { status: 'completed' });
    }
    
    res.json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all bills
exports.getAllBills = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.query;
    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    const bills = await Bill.find(filter)
      .populate('orderId', 'staffName phoneNumber')
      .populate('cashierId', 'username')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get bill by ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('orderId')
      .populate('cashierId', 'username');
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};