const Bill = require('../models/Bill');
const RestaurantOrder = require('../models/RestaurantOrder');

exports.createBill = async (req, res) => {
  try {
    const { orderId, discount, tax, paymentMethod } = req.body;
    
    // Generate unique bill number
    const count = await Bill.countDocuments();
    const billNumber = `BILL${String(count + 1).padStart(6, '0')}`;
    
    const bill = new Bill({ 
      billNumber,
      orderId, 
      discount, 
      tax, 
      paymentMethod 
    });
    await bill.save();
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find().populate('orderId').sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod } = req.body;
    const bill = await Bill.findByIdAndUpdate(
      id,
      { paidAmount, paymentMethod, status: 'paid' },
      { new: true }
    );
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processSplitPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payments } = req.body;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const bill = await Bill.findByIdAndUpdate(
      id,
      { splitPayments: payments, paidAmount: totalPaid, status: 'paid' },
      { new: true }
    );
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
