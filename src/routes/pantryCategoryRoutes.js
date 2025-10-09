const express = require('express');
const router = express.Router();
const pantryCategoryController = require('../controllers/pantryCategoryController');

// 📝 Routes for Pantry Category

// Get all categories
router.get('/all', pantryCategoryController.getAllCategories);

// Add new category
router.post('/add', pantryCategoryController.addCategory);

// Update category by ID
router.put('/update/:id', pantryCategoryController.updateCategory);

// Delete category by ID
router.delete('/delete/:id', pantryCategoryController.deleteCategory);

module.exports = router;
