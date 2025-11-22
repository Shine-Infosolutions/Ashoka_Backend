
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const WebSocket = require("ws");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.js");
const categoryRoutes = require("./src/routes/category.js");
const bookingRoutes = require("./src/routes/booking.js");
const roomRoutes = require("./src/routes/roomRoutes.js");
const reservationRoutes = require("./src/routes/reservation.js");
const housekeepingRoutes = require("./src/routes/housekeepingRoutes.js");
const laundryRoutes = require("./src/routes/laundryRoutes.js");
const LaundryRate = require("./src/routes/laundryRateRoutes.js");
const cabRoutes = require("./src/routes/cabBookingRoutes.js");
const driverRoutes = require("./src/routes/driverRoutes.js");
const vehicleRoutes = require("./src/routes/vehicleRoutes.js");
const inventoryRoutes = require("./src/routes/inventoryRoutes.js");
const purchaseOrderRoutes = require("./src/routes/purchaseOrderRoutes.js");
const pantryRoutes = require("./src/routes/pantryRoutes.js");
const tableRoutes = require("./src/routes/tableRoutes.js");
const itemRoutes = require("./src/routes/itemRoutes");
const couponRoutes = require("./src/routes/coupon");
const restaurantCategoryRoutes = require("./src/routes/restaurantCategoryRoutes");
const restaurantOrderRoutes = require("./src/routes/restaurantOrderRoutes");
const kotRoutes = require("./src/routes/kotRoutes");
const billRoutes = require("./src/routes/billRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const paginationRoutes = require("./src/routes/paginationRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes.js");
const checkoutRoutes = require("./src/routes/checkoutRoutes.js");
const paymentRoutes = require("./src/routes/paymentRoutes.js");
const restaurantReservationRoutes = require("./src/routes/restaurantReservationRoutes");
const banquetMenuRoutes = require("./src/routes/banquetMenuRoutes.js");
const banquetBookingRoutes = require("./src/routes/banquetBookingRoutes.js");
const planLimitRoutes = require("./src/routes/planLimitRoutes.js");
const menuItemRoutes = require("./src/routes/menuItemRoutes.js");
const banquetCategoryRoutes = require("./src/routes/banquetCategoryRoutes.js");
const cashTransactionRoutes = require("./src/routes/CashTransactionRoutes.js");
const dashboardRoutes = require("./src/routes/dashboardRoutes.js");
const wastageRoutes = require("./src/routes/wastageRoutes.js");
const attendanceRoutes = require("./src/routes/attendanceRoutes.js");
const payrollRoutes = require("./src/routes/payrollRoutes.js");
const salaryRoutes = require("./src/routes/salaryRoutes.js");
const vendorRoutes = require("./src/routes/vendorRoutes.js");
const roomInspectionRoutes = require("./src/routes/roomInspectionRoutes.js");
const pantryCategoryRoutes = require("./src/routes/pantryCategoryRoutes.js");
const kitchenOrderRoutes = require("./src/routes/kitchenRoutes.js");
const kitchenStoreRoutes = require("./src/routes/kitchenStoreRoutes.js");
const kitchenConsumptionRoutes = require("./src/routes/kitchenConsumptionRoutes.js");
const laundryVendorRoutes = require("./src/routes/laundryVendorRoutes.js");
const nocRoutes = require("./src/routes/nocRoutes.js");
const unitMasterRoutes = require("./src/routes/unitMasterRoutes.js");
const roomServiceRoutes = require("./src/routes/roomServiceRoutes.js");
const gstRoutes = require("./src/routes/gstRoutes.js");
const { restrictPantryAccess } = require("./src/middleware/authMiddleware.js");
const gstNumberRoutes = require("./src/routes/gstNumberRoutes.js");
const restaurantInvoiceRoutes = require("./src/routes/restaurantInvoiceRoutes.js");
const cloudSyncRouter = require("./src/sync/cloudSyncRouter");
const itemCategoryRoutes = require("./src/routes/itemCategoryRoutes.js");


const path = require("path");

// Initialize express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://ashokacrm.vercel.app",
        "https://zomato-frontend-mocha.vercel.app",
        "https://ashoka-api.shineinfosolutions.in",
        "https://ashoka-frontend.shineinfosolutions.in",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);
  
  // Join rooms
  socket.on("join-waiter-dashboard", () => {
    if (!socket.rooms.has("waiters")) {
      socket.join("waiters");
    } else {
      return;
    }
    console.log(`👨‍🍳 Socket ${socket.id} joined waiters room`);
  });
  
  socket.on("join-pantry-updates", () => {
    if (!socket.rooms.has("pantry-updates")) {
      socket.join("pantry-updates");
    } else {
      return;
    }
    console.log(`🥫 Socket ${socket.id} joined pantry-updates room`);
  });
  
  socket.on("join-kitchen-updates", () => {
    if (!socket.rooms.has("kitchen-updates")) {
      socket.join("kitchen-updates");
    } else {
      return;
    }
    console.log(`🍳 Socket ${socket.id} joined kitchen-updates room`);
  });
  
  // Test message handler
  socket.on("test-message", (data) => {
    console.log(`📨 Test message received from ${socket.id}:`, data);
    socket.emit("test-response", { message: "Hello from server!", timestamp: new Date() });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io available globally
app.set("io", io);

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://ashoka-api.shineinfosolutions.in",
  "https://ashoka-backend.vercel.app",
  "https://ashokacrm.vercel.app",
  "https://ashoka-frontend.shineinfosolutions.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "50mb" }));

// Serve uploaded files for fallback method
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Apply pantry access restriction globally
app.use("/api", restrictPantryAccess);

// Database connection
let isConnected = false;

// Middleware to ensure DB connection before each request
app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log("MongoDB connected successfully");
      
      // Initialize cloud sync router after DB connection
      if (!app.locals.syncRouterInitialized) {
        app.use("/sync", cloudSyncRouter(mongoose.connection.db));
        app.locals.syncRouterInitialized = true;
      }
    }
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/laundry", laundryRoutes);
app.use("/api/laundry-rates", LaundryRate);
app.use("/api/cab", cabRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/restaurant", tableRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/restaurant-categories", restaurantCategoryRoutes);
app.use("/api/restaurant-orders", restaurantOrderRoutes);
app.use("/api/kot", kotRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/paginate", paginationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/restaurant-reservations", restaurantReservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/banquet-menus", banquetMenuRoutes);
app.use("/api/banquet-bookings", banquetBookingRoutes);
app.use("/api/plan-limits", planLimitRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/banquet-categories", banquetCategoryRoutes);
app.use("/api/cash-transactions", cashTransactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/wastage", wastageRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/room-inspections", roomInspectionRoutes);
app.use("/api/pantry-categories", pantryCategoryRoutes);
app.use("/api/kitchen-orders", kitchenOrderRoutes);
app.use("/api/kitchen-store", kitchenStoreRoutes);
app.use("/api/kitchen-consumption", kitchenConsumptionRoutes);
app.use("/api/laundry-vendors", laundryVendorRoutes);
app.use("/api/noc", nocRoutes);
app.use("/api/units", unitMasterRoutes);
app.use("/api/room-service", roomServiceRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/gst-numbers", gstNumberRoutes);
app.use("/api/restaurant-invoices", restaurantInvoiceRoutes);
app.use("/api/item-categories", itemCategoryRoutes);
// Cloud sync router will be added after DB connection


// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    dbConnected: isConnected,
  });
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

// Export for serverless
module.exports = app;
