const express = require('express');
const router = express.Router();
const nocController = require('../controllers/nocController');

router.get('/all', nocController.getAllNOCs);
router.post('/create', nocController.createNOC);
router.put('/update/:id', nocController.updateNOC);
router.delete('/delete/:id', nocController.deleteNOC);

module.exports = router;
