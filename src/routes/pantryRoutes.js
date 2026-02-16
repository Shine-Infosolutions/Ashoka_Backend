const express = require("express");
const router = express.Router();
const pantryController = require("../controllers/pantryController");
const unitMasterController = require("../controllers/unitMasterController");
const { auth, authorize } = require("../middleware/auth");

// Unit Master Routes for Pantry
router.get(
  "/units",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  unitMasterController.getUnits
);

// Pantry Items Routes
router.get(
  "/items",
  pantryController.getAllPantryItems
);

router.get(
  "/items/low-stock",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getLowStockPantryItems
);

router.post(
  "/items",
  pantryController.createPantryItem
);

router.put(
  "/items/:id",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.updatePantryItem
);

router.delete(
  "/items/:id",
  auth,
  authorize("ADMIN"),
  pantryController.deletePantryItem
);

router.patch(
  "/items/:id/stock",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.updatePantryStock
);

router.get(
  "/invoice/low-stock",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.generateLowStockInvoice
);

router.get(
  "/invoices/vendor",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.generateVendorInvoice
);

// Pantry Orders Routes
router.get(
  "/orders",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getPantryOrders
);

router.get(
  "/orders/:id",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getPantryOrderById
);

router.post(
  "/orders",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.createPantryOrder
);

router.put(
  "/orders/:id",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.updatePantryOrder
);

router.patch(
  "/orders/:id/status",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.updatePantryOrderStatus
);

router.patch(
  "/orders/:orderId/payment-status",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.updatePaymentStatus
);

router.delete(
  "/orders/:id",
  auth,
  authorize("ADMIN"),
  pantryController.deletePantryOrder
);

// Fulfillment Routes
router.post(
  "/upload-pricing-image",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.uploadPricingImage
);

router.post(
  "/upload-chalan",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.uploadChalan
);

router.post(
  "/disburse-to-kitchen",
  pantryController.disburseToKitchen
);

router.get(
  "/disbursement-history",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getDisbursementHistory
);

router.put(
  "/fulfill-invoice/:orderId",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.fulfillInvoice
);

router.get(
  "/fulfillment-history/:orderId",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getFulfillmentHistory
);

router.get(
  "/orders/excel-report",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.generatePantryOrdersExcel
);

router.get(
  "/vendor-analytics/:vendorId",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getVendorAnalytics
);

router.get(
  "/suggested-vendors",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.getSuggestedVendors
);

router.get(
  "/items/excel-report",
  auth,
  authorize("ADMIN", "GM", "STAFF"),
  pantryController.generatePantryItemsExcel
);

module.exports = router;
