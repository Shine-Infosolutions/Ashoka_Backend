const express = require("express");
const router = express.Router();
const laundryVendorController = require("../controllers/laundryVendorController");
const { auth, authorize } = require("../middleware/auth");

// Get all vendors
router.get("/all", auth, authorize(['ADMIN', 'GM', 'STAFF','FRONT DESK']), laundryVendorController.getAllVendors);

// Get active vendors only (must be before /:id route)
router.get("/active", auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryVendorController.getActiveVendors);

// Get single vendor by ID
router.get("/get/:id", auth, authorize(['ADMIN', 'GM', 'STAFF','FRONT DESK']), laundryVendorController.getVendorById);

// Create vendor
router.post("/add", auth, authorize(['ADMIN', 'GM', 'STAFF','FRONT DESK']), laundryVendorController.createVendor);

// Update vendor
router.put("/update/:id", auth, authorize(['ADMIN', 'GM', 'STAFF','FRONT DESK']), laundryVendorController.updateVendor);
router.put("/:id", auth, authorize(['ADMIN', 'GM', 'STAFF','FRONT DESK']), laundryVendorController.updateVendor);

// Delete vendor
router.delete("/delete/:id", auth, authorize(['ADMIN']), laundryVendorController.deleteVendor);
router.delete("/:id", auth, authorize(['ADMIN']), laundryVendorController.deleteVendor);

module.exports = router;
