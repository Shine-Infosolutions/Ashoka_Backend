const express = require('express');
const {
    createAddon,
    getAddons,
    getAddonById,
    updateAddon,
    deleteAddon
} = require('../controllers/addonController');

const router = express.Router();

router.post('/add/addon', createAddon);
router.get('/all/addon', getAddons);
router.get('/get/addon/:id', getAddonById);
router.put('/update/addon/:id', updateAddon);
router.delete('/delete/addon/:id', deleteAddon);

module.exports = router;