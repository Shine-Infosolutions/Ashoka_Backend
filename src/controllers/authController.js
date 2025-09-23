const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

exports.register = async (req, res) => {
  try {
    const {email, username, password, role, department, restaurantRole } = req.body;
    if (!email || !username || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!['admin', 'staff', 'restaurant'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only admin, staff, or restaurant allowed.' });
    }
    // const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    // if (existingUser) {
    //   return res.status(409).json({ message: 'Email or username already exists' });
    // }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if( existingUser ) {
        return res.status(409).json({ message: 'Emai; or username already exists' });
    }
    if (role === 'staff' && !department) {
      return res.status(400).json({ message: 'Staff must have a department' });
    }
    if (role === 'restaurant' && !restaurantRole) {
      return res.status(400).json({ message: 'Restaurant role must be specified' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let userData = { email, username, password: hashedPassword, role };
    if (role === 'staff') {
      // Store department as array of objects with id and name
      userData.department = Array.isArray(department)
        ? department.map(dep => ({ id: dep.id, name: dep.name }))
        : department;
    } else if (role === 'admin') {
      userData.department = [
        { id: 1, name: 'kitchen' },
        { id: 2, name: 'laundry' },
        { id: 3, name: 'reception' },
        { id: 4, name: 'maintenance' },
        { id: 5, name: 'other' },
        { id: 6, name: 'housekeeping' }
      ];
    } else if (role === 'restaurant') {
      userData.restaurantRole = restaurantRole;
    }
    const user = new User(userData);
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role, department: user.department, restaurantRole: user.restaurantRole }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
    res.json({ token, user, role: user.role, department: user.department, restaurantRole: user.restaurantRole, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getStaffProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user.id;
    
    // Find the user with their department details
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For staff users, return their specific data
    if (user.role === 'staff') {
      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        departments: user.department,
        createdAt: user.createdAt
      });
    } 
    // For admin users
    else if (user.role === 'admin') {
      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        departments: user.department,
        isAdmin: true,
        createdAt: user.createdAt
      });
    }
    // For restaurant users
    else if (user.role === 'restaurant') {
      return res.json({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        restaurantRole: user.restaurantRole,
        createdAt: user.createdAt
      });
    }
    
    // Fallback
    return res.json(user);
    
  } catch (err) {
    console.error('Error in getStaffProfile:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    
    // Inline pagination functions
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
        hasPrevPage: pageNum > 1
      };
    };
    
    const query = User.find().select('-password').sort({ createdAt: -1 });
    const users = await paginate(query, page, limit);
    const pagination = await getPaginationMeta(User, {}, page, limit);
    
    res.json({
      users,
      pagination
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Validate role if provided
    if (updates.role && !['admin', 'staff', 'restaurant'].includes(updates.role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Hash password if provided
    if (updates.password && updates.password.trim() !== '') {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // If updating department, ensure it's an array of objects for staff
    if (updates.department && Array.isArray(updates.department)) {
      updates.department = updates.department.map(dep => ({
        id: dep.id,
        name: dep.name
      }));
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
