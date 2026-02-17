const express = require('express');
const router = express.Router();
const inRoomOrderController = require('../controllers/inRoomOrderController');
const { auth, authorize } = require('../middleware/auth');

router.post('/create', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inRoomOrderController.createOrder);
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inRoomOrderController.getAllOrders);
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inRoomOrderController.updateOrderStatus);
router.patch('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inRoomOrderController.updateOrder);
router.get('/details/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inRoomOrderController.getOrderDetails);

module.exports = router;
