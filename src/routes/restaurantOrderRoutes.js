const express = require('express');
const router = express.Router();
const restaurantOrderController = require('../controllers/restaurantOrderController');
const { auth, authorize } = require('../middleware/auth');

// Create new restaurant order (All roles)
router.post('/create', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.createOrder);

// Get all restaurant orders (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.getAllOrders);

// Update restaurant order status (All roles)
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.updateOrderStatus);

// Update restaurant order (All roles)
router.patch('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.updateOrder);

// Link existing orders to bookings (Admin, GM)
router.post('/link-to-bookings', auth, authorize(['ADMIN', 'GM', 'FRONT DESK']), restaurantOrderController.linkOrdersToBookings);

// Get order details
router.get('/details/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.getOrderDetails);

// Transfer table
router.patch('/:id/transfer-table', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantOrderController.transferTable);

// Add items to order
router.patch('/:id/add-items', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantOrderController.addItems);

// Add transaction to order
router.patch('/:id/add-transaction', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.addTransaction);

// Get invoice
router.get('/invoice/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.getInvoice);

// NEW ENHANCED ROUTES FOR ORDER & KOT SYSTEM

// Update item status in order
router.patch('/:orderId/item-status/:itemIndex', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantOrderController.updateItemStatus);

// Add extra items to existing order
router.post('/:orderId/extra-items', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantOrderController.addExtraItems);

// Update extra item status
router.patch('/:orderId/extra-item-status/:itemIndex', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantOrderController.updateExtraItemStatus);

// Process payment with enhanced features
router.post('/:id/payment', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.processPayment);

module.exports = router;