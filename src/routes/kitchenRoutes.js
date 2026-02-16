const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getAllKitchenOrders,
  getKitchenOrderById,
  createKitchenOrder,
  updateKitchenOrder,
  deleteKitchenOrder,
  syncMissingKitchenOrders
} = require('../controllers/kitchenOrderController');

// Kitchen Order routes
router.get('/', auth, authorize('ADMIN', 'GM', 'STAFF'), getAllKitchenOrders);
router.get('/:id', auth, authorize('ADMIN', 'GM', 'STAFF'), getKitchenOrderById);
router.post('/', auth, authorize('ADMIN', 'GM', 'STAFF'), createKitchenOrder);
router.put('/:id', auth, authorize('ADMIN', 'GM', 'STAFF'), updateKitchenOrder);
router.delete('/:id', auth, authorize('ADMIN'), deleteKitchenOrder);
router.post('/sync', auth, authorize('ADMIN', 'GM', 'STAFF'), syncMissingKitchenOrders);

module.exports = router;
