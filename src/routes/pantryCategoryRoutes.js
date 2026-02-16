const express = require('express');
const router = express.Router();
const pantryCategoryController = require('../controllers/pantryCategoryController');
const { auth, authorize } = require('../middleware/auth');

// 📝 Routes for Pantry Category

// Get all categories
router.get('/all', auth, authorize('ADMIN', 'GM', 'STAFF'), pantryCategoryController.getAllCategories);

// Add new category
router.post('/add', auth, authorize('ADMIN', 'GM', 'STAFF'), pantryCategoryController.addCategory);

// Update category by ID
router.put('/update/:id', auth, authorize('ADMIN', 'GM', 'STAFF'), pantryCategoryController.updateCategory);

// Delete category by ID
router.delete('/delete/:id', auth, authorize('ADMIN'), pantryCategoryController.deleteCategory);

module.exports = router;
