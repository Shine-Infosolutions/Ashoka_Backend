const express = require('express');
const router = express.Router();
const {
  createDisbursement,
  getAllDisbursements,
  getDisbursementById,
  getStockTrackingReport
} = require('../controllers/disbursementController');

router.post('/', createDisbursement);
router.get('/', getAllDisbursements);
router.get('/tracking', getStockTrackingReport);
router.get('/:id', getDisbursementById);

module.exports = router;