const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getAllKitchenOrders,
  getKitchenOrderById,
  createKitchenOrder,
  updateKitchenOrder,
  deleteKitchenOrder
} = require('../controllers/kitchenOrderController');

// Kitchen Order routes
router.get('/', authMiddleware(['admin', 'staff']), getAllKitchenOrders);
router.get('/:id', authMiddleware(['admin', 'staff']), getKitchenOrderById);
router.post('/', authMiddleware(['admin', 'staff']), createKitchenOrder);
router.put('/:id', authMiddleware(['admin', 'staff']), updateKitchenOrder);
router.delete('/:id', authMiddleware(['admin', 'staff']), deleteKitchenOrder);

module.exports = router;
