const express = require("express");
const {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} = require("../controllers/staffController");

const router = express.Router();

router.post("/add", addStaff);
router.get("/all", getAllStaff);
router.get("/:id", getStaffById);
router.put("/update/:id", updateStaff);
router.delete("/delete/:id", deleteStaff);

module.exports = router;
