const express = require('express');
const router = express.Router();
const {
  createConsumption,
  getAllConsumptions,
  getConsumptionById,
  deleteConsumption
} = require('../controllers/kitchenConsumptionController');
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(auth);
router.use(authorize('ADMIN', 'GM', 'STAFF'));

// Routes
router.post('/', createConsumption);
router.get('/', getAllConsumptions);
router.get('/:id', getConsumptionById);
router.delete('/:id', deleteConsumption);

module.exports = router;