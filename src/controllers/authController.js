const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

// Helper to normalize department into array of objects
const normalizeDepartment = (department) => {
  if (!department) return [];
  if (Array.isArray(department)) {
    return department.map((dep) => ({
      id: dep.id || 1,
      name: dep.name || dep,
    }));
  }
  if (typeof department === "string") {
    return department.split(",").map((name, index) => ({
      id: index + 1,
      name: name.trim(),
    }));
  }
  return [];
};

exports.register = async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      role,
      department,
      restaurantRole,
      salary,
    } = req.body;

    if (!email || !username || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!["admin", "staff", "restaurant", "pantry"].includes(role)) {
      return res
        .status(400)
        .json({
          message: "Invalid role. Only admin, staff, restaurant, or pantry allowed.",
        });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email or username already exists" });
    }

    if (role === "staff" && !department) {
      return res.status(400).json({ message: "Staff must have a department" });
    }
    if (role === "restaurant" && !restaurantRole) {
      return res
        .status(400)
        .json({ message: "Restaurant role must be specified" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let userData = { email, username, password: hashedPassword, role };

    if (role === "staff") {
      userData.department = normalizeDepartment(department);
    } else if (role === "admin") {
      userData.department = [
        { id: 1, name: "kitchen" },
        { id: 2, name: "laundry" },
        { id: 3, name: "reception" },
        { id: 4, name: "maintenance" },
        { id: 5, name: "other" },
        { id: 6, name: "housekeeping" },
        { id: 7, name: "pantry" },
      ];
    } else if (role === "restaurant") {
      userData.restaurantRole = restaurantRole;
    } else if (role === "pantry") {
      userData.department = [{ id: 7, name: "pantry" }];
    }

    const user = new User(userData);
    await user.save();



    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        department: user.department,
        restaurantRole: user.restaurantRole,
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );



    res.json({
      token,
      user,
      role: user.role,
      department: user.department,
      restaurantRole: user.restaurantRole,
      username: user.username,

    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStaffProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare the base response
    let responseData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    if (user.role === "staff") {
      responseData.departments = user.department;
    } else if (user.role === "admin") {
      responseData.departments = user.department;
      responseData.isAdmin = true;
    } else if (user.role === "restaurant") {
      responseData.restaurantRole = user.restaurantRole;
    } else if (user.role === "pantry") {
      responseData.departments = user.department;
      responseData.isPantryStaff = true;
    }

    res.json(responseData);
  } catch (err) {
    console.error("Error in getStaffProfile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;

    const paginate = (query, page, limit) => {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      return query.skip(skip).limit(limitNum);
    };

    const getPaginationMeta = async (model, filter, page, limit) => {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const total = await model.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);

      return {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      };
    };

    const query = User.find().select("-password").sort({ createdAt: -1 });
    const users = await paginate(query, page, limit);
    const pagination = await getPaginationMeta(User, {}, page, limit);

    res.json({
      users,
      pagination,
    });
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// exports.updateUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     // Remove password from updates if present
//     delete updates.password;

//     const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     res.json(user);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// exports.deleteUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findByIdAndDelete(id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     res.json({ message: 'User deleted successfully' });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// Delete User (also delete linked Staff record if staff)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }



    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error in deleteUser:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update User (also update linked Staff record if staff)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Validate role if provided
    if (
      updates.role &&
      !["admin", "staff", "restaurant", "pantry"].includes(updates.role)
    ) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Hash password if provided
    if (updates.password && updates.password.trim() !== "") {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Ensure department is array of objects for staff
    if (updates.department && Array.isArray(updates.department)) {
      updates.department = updates.department.map((dep) => ({
        id: dep.id,
        name: dep.name,
      }));
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }



    res.json(updatedUser);
  } catch (err) {
    console.error("Error in updateUser:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
