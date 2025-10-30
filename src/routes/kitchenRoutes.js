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
router.get('/', authMiddleware(['admin', 'staff', 'restaurant']), getAllKitchenOrders);
router.get('/:id', authMiddleware(['admin', 'staff', 'restaurant']), getKitchenOrderById);
router.post('/', authMiddleware(['admin', 'staff', 'restaurant']), createKitchenOrder);
router.put('/:id', authMiddleware(['admin', 'staff', 'restaurant']), updateKitchenOrder);
router.delete('/:id', authMiddleware(['admin', 'staff', 'restaurant']), deleteKitchenOrder);

module.exports = router;
