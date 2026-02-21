const express = require('express');
const router = express.Router();
const restaurantTableController = require('../controllers/restaurantTableController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantTableController.getAllTables);
router.get('/all', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), restaurantTableController.getAllTables);
router.post('/', auth, authorize(['ADMIN', 'GM']), restaurantTableController.createTable);
router.post('/create', auth, authorize(['ADMIN', 'GM']), restaurantTableController.createTable);
router.put('/:id', auth, authorize(['ADMIN', 'GM', 'STAFF']), restaurantTableController.updateTableStatus);
router.put('/update/:id', auth, authorize(['ADMIN', 'GM', 'STAFF']), restaurantTableController.updateTableStatus);
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'STAFF']), restaurantTableController.updateTableStatus);
router.delete('/:id', auth, authorize(['ADMIN']), restaurantTableController.deleteTable);
router.delete('/delete/:id', auth, authorize(['ADMIN']), restaurantTableController.deleteTable);

module.exports = router;
