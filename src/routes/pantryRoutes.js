const express = require('express');
const router = express.Router();
const pantryController = require('../controllers/pantryController');
const authMiddleware = require('../middleware/authMiddleware');

// Pantry Items Routes
router.get(
  '/items',
  authMiddleware(['admin', 'staff'], ['kitchen', 'pantry', 'reception']),
  pantryController.getAllPantryItems
);

router.get(
  '/items/low-stock',
  authMiddleware(['admin', 'staff'], ['pantry', 'reception']),
  pantryController.getLowStockPantryItems
);

router.post(
  '/items',
  authMiddleware(['admin', 'staff'], ['pantry']),
  pantryController.createPantryItem
);

router.put(
  '/items/:id',
  authMiddleware(['admin', 'staff'], ['pantry']),
  pantryController.updatePantryItem
);

router.delete(
  '/items/:id',
  authMiddleware(['admin']),
  pantryController.deletePantryItem
);

router.patch(
  '/items/:id/stock',
  authMiddleware(['admin', 'staff'], ['pantry']),
  pantryController.updatePantryStock
);

router.get(
  '/invoice/low-stock',
  authMiddleware(['admin', 'staff'], ['pantry']),
  pantryController.generateLowStockInvoice
);

// Pantry Orders Routes
router.get(
  '/orders',
  authMiddleware(['admin', 'staff'], ['kitchen', 'pantry', 'reception']),
  pantryController.getPantryOrders
);

router.post(
  '/orders',
  authMiddleware(['admin', 'staff'], ['kitchen', 'pantry']),
  pantryController.createPantryOrder
);

router.patch(
  '/orders/:id/status',
  authMiddleware(['admin', 'staff'], ['pantry', 'reception']),
  pantryController.updatePantryOrderStatus
);

module.exports = router;