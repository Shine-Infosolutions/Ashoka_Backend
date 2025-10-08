const CashTransaction = require('../models/CashTransaction');
const mongoose = require('mongoose');

// 💰 Get cash summary + optional filters (date, week, month, year, today, source) + pagination
const getCashAtReception = async (req, res) => {
  try {
    const { filter, source, page = 1, limit = 10 } = req.query; // pagination

    const matchConditions = {};

    // 🗓️ Apply source filter
    if (source) {
      const validSources = ['RESTAURANT', 'ROOM_BOOKING', 'BANQUET + PARTY', 'OTHER'];
      if (!validSources.includes(source.toUpperCase())) {
        return res.status(400).json({ message: `Invalid source. Valid sources: ${validSources.join(', ')}` });
      }
      matchConditions.source = source.toUpperCase();
    }

    // 🕒 Apply date filters
    const now = new Date();
    let startDate, endDate;

    switch (filter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;

      case 'week': {
        const curr = new Date();
        const first = curr.getDate() - curr.getDay(); // Sunday
        startDate = new Date(curr.setDate(first));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;

      case 'date': {
        if (req.query.date) {
          const d = new Date(req.query.date);
          if (isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid date format' });
          startDate = new Date(d.setHours(0, 0, 0, 0));
          endDate = new Date(d.setHours(23, 59, 59, 999));
        }
        break;
      }
    }

    if (startDate && endDate) {
      matchConditions.createdAt = { $gte: startDate, $lte: endDate };
    }

    // 🔍 Total received (KEEP)
    const totalIn = await CashTransaction.aggregate([
      { $match: { ...matchConditions, type: 'KEEP' } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } }
    ]);

    // 🔍 Total sent (SENT)
    const totalOut = await CashTransaction.aggregate([
      { $match: { ...matchConditions, type: 'SENT' } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } }
    ]);

    // 🔢 Summary calculation
    const totalReceived = totalIn.reduce((sum, s) => sum + s.total, 0);
    const totalSent = totalOut.reduce((sum, s) => sum + s.total, 0);
    const cashInReception = totalReceived - totalSent;

    // 📦 Transactions list with pagination
    const transactions = await CashTransaction.find(matchConditions)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('receptionistId', 'name email');

    const totalTransactions = await CashTransaction.countDocuments(matchConditions);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      filterApplied: filter || 'all',
      sourceFilter: source || 'all',
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      summary: { totalReceived, totalSent, cashInReception },
      breakdown: { receivedBreakdown: totalIn, sentBreakdown: totalOut },
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages, totalTransactions },
      transactions,
    });
  } catch (err) {
    console.error('Error fetching cash report:', err);
    res.status(500).json({ message: 'Server error while fetching cash report' });
  }
};

// ➕ Add new cash transaction with validation
const addCashTransaction = async (req, res) => {
  try {
    const { amount, type, description, receptionistId, source } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!['KEEP', 'SENT'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either KEEP or SENT' });
    }
    const validSources = ['RESTAURANT', 'ROOM_BOOKING', 'BANQUET + PARTY', 'OTHER'];
    if (!source || !validSources.includes(source.toUpperCase())) {
      return res.status(400).json({ message: `Source is required. Valid sources: ${validSources.join(', ')}` });
    }

    const transaction = await CashTransaction.create({
      amount,
      type,
      description,
      source: source.toUpperCase(),
      receptionistId,
    });

    res.status(201).json({ message: 'Transaction added successfully', transaction });
  } catch (err) {
    console.error('Error adding cash transaction:', err);
    res.status(500).json({ message: 'Server error while adding transaction' });
  }
};

// 📋 Get all transactions (unfiltered) with pagination
const getAllCashTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const transactions = await CashTransaction.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('receptionistId', 'name email');

    const totalTransactions = await CashTransaction.countDocuments();
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages, totalTransactions },
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all transactions' });
  }
};

module.exports = {
  getCashAtReception,
  addCashTransaction,
  getAllCashTransactions,
};
