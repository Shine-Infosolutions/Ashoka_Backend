const Staff = require("../models/Staff");
const User = require("../models/User");

// ✅ Helper: normalize department into [{ id, name }]
const normalizeDepartment = (department) => {
  if (!department) return [];
  if (Array.isArray(department)) {
    return department.map(dep => ({
      id: dep.id || 1,
      name: dep.name || dep
    }));
  }
  if (typeof department === "string") {
    // Split string by comma and trim
    return department.split(',').map((name, index) => ({
      id: index + 1,
      name: name.trim()
    }));
  }
  return [];
};

// ✅ Add new staff
exports.addStaff = async (req, res) => {
  try {
    const { userId, salary, department } = req.body;

    // 1. Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Ensure user is staff role
    if (user.role !== "staff") {
      return res.status(400).json({ message: "User must have role 'staff' to create staff record" });
    }

    // 3. Check if staff record already exists
    const existingStaff = await Staff.findOne({ userId });
    if (existingStaff) {
      return res.status(400).json({ message: "Staff record already exists for this user" });
    }

    // 4. Normalize department
    const normalizedDepartment = normalizeDepartment(department);

    // 5. Create staff record
    const staff = new Staff({
      userId,
      salary,
      department: normalizedDepartment,
    });

    await staff.save();

    res.status(201).json({
      message: "Staff created successfully",
      staff
    });
  } catch (error) {
    console.error("Error in addStaff:", error);
    res.status(500).json({
      message: "Error adding staff",
      error: error.message
    });
  }
};

// ✅ Update staff (salary, department, etc.)
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, department } = req.body;

    const updates = {};
    if (salary !== undefined) updates.salary = salary;
    if (department) updates.department = normalizeDepartment(department);

    const staff = await Staff.findByIdAndUpdate(id, updates, { new: true });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Also sync department in User model if provided
    if (department) {
      await User.findByIdAndUpdate(staff.userId, { department: updates.department }, { new: true });
    }

    res.status(200).json({ message: "Staff updated successfully", staff });
  } catch (error) {
    res.status(500).json({ message: "Error updating staff", error: error.message });
  }
};

// ✅ Get all staff with user details
exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().populate("userId", "username email role department");
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error: error.message });
  }
};

// ✅ Get single staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id).populate("userId", "username email role department");

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error: error.message });
  }
};

// ✅ Delete staff
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findByIdAndDelete(id);

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Optionally, clear department from User when staff is deleted
    await User.findByIdAndUpdate(staff.userId, { department: [] });

    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting staff", error: error.message });
  }
};
