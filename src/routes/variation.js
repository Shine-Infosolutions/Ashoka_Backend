const express = require('express');
const {
    createVariation,
    getVariations,
    getVariationById,
    updateVariation,
    deleteVariation
} = require('../controllers/variationController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/add/variation', auth, authorize(['ADMIN', 'STAFF']), createVariation);
router.get('/all/variation', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), getVariations);
router.get('/get/variation/:id', auth, authorize(['ADMIN', 'STAFF', 'FRONT DESK']), getVariationById);
router.put('/update/variation/:id', auth, authorize(['ADMIN', 'STAFF']), updateVariation);
router.delete('/delete/variation/:id', auth, authorize(['ADMIN']), deleteVariation);

module.exports = router;