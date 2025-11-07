const express = require('express');
const kotController = require('../controllers/kotController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware(['admin', 'staff', 'restaurant']), kotController.createKOT);
router.get('/all', authMiddleware(['admin', 'staff', 'restaurant']), kotController.getAllKOTs);
router.get('/:id', authMiddleware(['admin', 'staff', 'restaurant']), kotController.getKOTById);
router.patch('/:id/status', authMiddleware(['admin', 'staff', 'restaurant']), kotController.updateKOTStatus);
router.patch('/:kotId/item-statuses', authMiddleware(['admin', 'staff', 'restaurant']), kotController.updateItemStatuses);

module.exports = router;
