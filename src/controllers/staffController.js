const Staff = require("../models/Staff");
const User = require("../models/User"); 

// ✅ Add new staff
exports.addStaff = async (req, res) => {
  try {
    const { userId, salary, department } = req.body;

    // check user exist karta hai ya nahi
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // staff record create
    const staff = new Staff({
      userId,
      salary,
      department,
    });

    await staff.save();

    res.status(201).json({ message: "Staff created successfully", staff });
  } catch (error) {
    res.status(500).json({ message: "Error adding staff", error: error.message });
  }
};

// ✅ Get all staff with user details
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().populate("userId", "username email role");
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error: error.message });
  }
};

// ✅ Get single staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id).populate("userId", "username email role");

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error: error.message });
  }
};

// ✅ Update staff (salary, dept, etc.)
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, department } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      id,
      { salary, department },
      { new: true }
    );

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({ message: "Staff updated successfully", staff });
  } catch (error) {
    res.status(500).json({ message: "Error updating staff", error: error.message });
  }
};

// ✅ Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByIdAndDelete(id);

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting staff", error: error.message });
  }
};
