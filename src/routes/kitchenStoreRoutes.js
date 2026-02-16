const express = require('express');
const router = express.Router();
const kitchenStoreController = require('../controllers/kitchenStoreController');
const { auth, authorize } = require('../middleware/auth');

// Get all kitchen store items
router.get('/items', auth, authorize('ADMIN', 'GM', 'STAFF'), kitchenStoreController.getItems);

// Create kitchen store item
router.post('/items', auth, authorize('ADMIN', 'GM', 'STAFF'), kitchenStoreController.createItem);

// Update kitchen store item
router.put('/items/:id', auth, authorize('ADMIN', 'GM', 'STAFF'), kitchenStoreController.updateItem);

// Take out items from kitchen store
router.post('/take-out', auth, authorize('ADMIN', 'GM', 'STAFF'), kitchenStoreController.takeOutItems);

// Create order for out of stock item
router.post('/order/:id', auth, authorize('ADMIN', 'GM', 'STAFF'), kitchenStoreController.createOrder);

// Delete kitchen store item
router.delete('/items/:id', auth, authorize('ADMIN'), kitchenStoreController.deleteItem);

module.exports = router;
