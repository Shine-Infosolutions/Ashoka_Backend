const express = require('express');
const router = express.Router();
const kitchenStoreController = require('../controllers/kitchenStoreController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all kitchen store items
router.get('/items', authMiddleware(['admin', 'staff']), kitchenStoreController.getItems);

// Create kitchen store item
router.post('/items', authMiddleware(['admin', 'staff']), kitchenStoreController.createItem);

// Update kitchen store item
router.put('/items/:id', authMiddleware(['admin', 'staff']), kitchenStoreController.updateItem);

// Delete kitchen store item
router.delete('/items/:id', authMiddleware(['admin', 'staff']), kitchenStoreController.deleteItem);

module.exports = router;
