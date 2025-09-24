const CashTransaction = require('../models/CashTransaction');


const getCashAtReception = async (req, res) => {
  try {
    // Total cash received (IN)
    const totalIn = await CashTransaction.aggregate([
      { $match: { type: 'KEEP' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Total cash sent to office (OUT)
    const totalOut = await CashTransaction.aggregate([
      { $match: { type: 'SENT' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Cash currently at reception
    const cashInReception = (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

    res.json({
      cashInReception,
      totalReceived: totalIn[0]?.total || 0,
      totalSentToOffice: totalOut[0]?.total || 0
    });
  } catch (err) {
    console.error('Error fetching cash report:', err);
    res.status(500).json({ message: 'Server error while fetching cash report' });
  }
};

const addCashTransaction = async (req, res) => {
  try {
    const { amount, type, description, receptionistId } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: "Amount and type are required" });
    }

    const transaction = await CashTransaction.create({
      amount,
      type,
      description,
      receptionistId
    });

    res.status(201).json({ message: "Transaction added successfully", transaction });
  } catch (err) {
    console.error('Error adding cash transaction:', err);
    res.status(500).json({ message: 'Server error while adding transaction' });
  }
};

module.exports = {
  getCashAtReception,
  addCashTransaction
};
