const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");

// Get all vendors
router.get("/all", vendorController.getAllVendors);

// Get single vendor by ID
router.get("/get/:id", vendorController.getVendorById);

// Create vendor
router.post("/add", vendorController.createVendor);

// Update vendor
router.put("/update/:id", vendorController.updateVendor);
router.put("/:id", vendorController.updateVendor);

// Delete vendor
router.delete("/delete/:id", vendorController.deleteVendor);
router.delete("/:id", vendorController.deleteVendor);

module.exports = router;
