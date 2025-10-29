const express = require('express');
const router = express.Router();
const {
  getAllKitchenOrders,
  getKitchenOrderById,
  createKitchenOrder,
  updateKitchenOrder,
  deleteKitchenOrder
} = require('../controllers/kitchenOrderController');

// Kitchen Order routes
router.get('/', getAllKitchenOrders);
router.get('/:id', getKitchenOrderById);
router.post('/', createKitchenOrder);
router.put('/:id', updateKitchenOrder);
router.delete('/:id', deleteKitchenOrder);

module.exports = router;