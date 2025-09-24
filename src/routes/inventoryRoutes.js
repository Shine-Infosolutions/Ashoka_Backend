const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all inventory items
router.get('/items',  inventoryController.getItems);

// Create inventory item
router.post('/items',  inventoryController.createItem);

// Update item stock
router.put('/items/:itemId/stock',  inventoryController.updateStock);

// Get all transactions
router.get('/transactions',  inventoryController.getTransactions);

// Create transaction
router.post('/transactions',  inventoryController.createTransaction);

// Get transaction history for specific item
router.get('/transactions/:inventoryId',  inventoryController.getTransactionHistory);

// Room inventory checklist routes
router.get('/room/:roomId/checklist',  inventoryController.getRoomChecklist);
router.post('/room/:roomId/checklist',  inventoryController.createRoomChecklist);
router.put('/checklist/:checklistId',  inventoryController.updateChecklist);

// Debug route to check inventory
router.get('/debug/count',  async (req, res) => {
  try {
    const Inventory = require('../models/Inventory');
    const count = await Inventory.countDocuments();
    const items = await Inventory.find().limit(5);
    res.json({ count, sampleItems: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;