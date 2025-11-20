const express = require('express');
const itemCategoryController = require('../controllers/itemCategoryController');

const router = express.Router();

router.get('/all', itemCategoryController.getItemCategories);
router.post('/add', itemCategoryController.createItemCategory);
router.get('/get/:id', itemCategoryController.getItemCategoryById);
router.put('/update/:id', itemCategoryController.updateItemCategory);
router.delete('/delete/:id', itemCategoryController.deleteItemCategory);

module.exports = router;