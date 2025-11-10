const express = require("express");
const router = express.Router();
const roomServiceController = require("../controllers/roomServiceController");
const { authMiddleware } = require("../middleware/authMiddleware");
const auth = authMiddleware();

// Create new room service order
router.post("/order", auth, roomServiceController.createOrder);

// Get all orders with filters
router.get("/orders", auth, roomServiceController.getAllOrders);

// Get order by ID
router.get("/order/:id", auth, roomServiceController.getOrderById);

// Update order status
router.patch("/order/:id/status", auth, roomServiceController.updateOrderStatus);

// Generate KOT
router.post("/order/:id/kot", auth, roomServiceController.generateKOT);

// Generate Bill
router.post("/order/:id/bill", auth, roomServiceController.generateBill);

// Bill lookup
router.get("/bill-lookup", auth, roomServiceController.billLookup);

// Update payment status
router.patch("/order/:id/payment", auth, roomServiceController.updatePaymentStatus);

// Delete order
router.delete("/order/:id", auth, roomServiceController.deleteOrder);

module.exports = router;