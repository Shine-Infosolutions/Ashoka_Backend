const express = require('express');
const {
    createVariation,
    getVariations,
    getVariationById,
    updateVariation,
    deleteVariation
} = require('../controllers/variationController');

const router = express.Router();

router.post('/add/variation', createVariation);
router.get('/all/variation', getVariations);
router.get('/get/variation/:id', getVariationById);
router.put('/update/variation/:id', updateVariation);
router.delete('/delete/variation/:id', deleteVariation);

module.exports = router;