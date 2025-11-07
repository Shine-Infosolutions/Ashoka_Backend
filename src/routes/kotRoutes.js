const express = require('express');
const kotController = require('../controllers/kotController');
const { authMiddleware } = require('../middleware/authMiddleware');
const KOT = require('../models/KOT');

const router = express.Router();

router.post('/create', authMiddleware(['admin', 'staff', 'restaurant']), kotController.createKOT);
router.get('/all', authMiddleware(['admin', 'staff', 'restaurant']), kotController.getAllKOTs);

// PATCH /api/kot/:kotId/item-statuses
router.patch('/:kotId/item-statuses', async (req, res) => {
  try {
    const { kotId } = req.params;
    const { itemStatuses } = req.body;
    
    const kot = await KOT.findByIdAndUpdate(
      kotId,
      { $set: { itemStatuses } },
      { new: true }
    );
    
    if (!kot) {
      return res.status(404).json({ message: 'KOT not found' });
    }
    
    res.json({ message: 'Item statuses updated', kot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authMiddleware(['admin', 'staff', 'restaurant']), kotController.getKOTById);
router.patch('/:id/status', authMiddleware(['admin', 'staff', 'restaurant']), kotController.updateKOTStatus);

module.exports = router;
