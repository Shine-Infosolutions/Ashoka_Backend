const express = require('express');
const router = express.Router();
const { 
  createGSTNumber, 
  getAllGSTNumbers, 
  getGSTNumberById, 
  updateGSTNumber, 
  deleteGSTNumber 
} = require('../controllers/gstNumberController');

// GST Number routes
router.post('/create', createGSTNumber);
router.get('/all', getAllGSTNumbers);
router.get('/:id', getGSTNumberById);
router.put('/update/:id', updateGSTNumber);
router.delete('/delete/:id', deleteGSTNumber);

module.exports = router;