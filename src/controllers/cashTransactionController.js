const CashTransaction = require('../models/CashTransaction');


// 💰 Get total cash + breakdown by source
const getCashAtReception = async (req, res) => {
  try {
    // Total received (KEEP)
    const totalIn = await CashTransaction.aggregate([
      { $match: { type: 'KEEP' } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } }
    ]);

    // Total sent (SENT)
    const totalOut = await CashTransaction.aggregate([
      { $match: { type: 'SENT' } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } }
    ]);

    // Calculate total IN, total OUT, and current cash
    const totalReceived = totalIn.reduce((sum, s) => sum + s.total, 0);
    const totalSent = totalOut.reduce((sum, s) => sum + s.total, 0);
    const cashInReception = totalReceived - totalSent;

    res.json({
      cashInReception,
      totalReceived,
      totalSentToOffice: totalSent,
      receivedBreakdown: totalIn,  // [{ _id: 'RESTAURANT', total: 5000 }, ...]
      sentBreakdown: totalOut
    });
  } catch (err) {
    console.error('Error fetching cash report:', err);
    res.status(500).json({ message: 'Server error while fetching cash report' });
  }
};

// ➕ Add new cash transaction
const addCashTransaction = async (req, res) => {
  try {
    const { amount, type, description, receptionistId, source } = req.body;

    if (!amount || !type || !source) {
      return res.status(400).json({ message: "Amount, type, and source are required" });
    }

    const transaction = await CashTransaction.create({
      amount,
      type,
      description,
      source,
      receptionistId
    });

    res.status(201).json({
      message: "Transaction added successfully",
      transaction
    });
  } catch (err) {
    console.error('Error adding cash transaction:', err);
    res.status(500).json({ message: 'Server error while adding transaction' });
  }
};

module.exports = {
  getCashAtReception,
  addCashTransaction
};
