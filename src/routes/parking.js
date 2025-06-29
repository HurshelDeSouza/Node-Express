const express = require('express');
const parkingController = require('../controllers/parkingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/parking/spaces - List parking spaces
router.get('/spaces', parkingController.getParkingSpaces);

// GET /api/parking/occupancy - Get parking occupancy
router.get('/occupancy', parkingController.getOccupancy);

// POST /api/parking/spaces - Create parking space (admin only)
router.post('/spaces', authorizeRoles('admin'), parkingController.createParkingSpace);

// PUT /api/parking/spaces/:id - Update parking space (admin only)
router.put('/spaces/:id', authorizeRoles('admin'), parkingController.updateParkingSpace);

// DELETE /api/parking/spaces/:id - Delete parking space (admin only)
router.delete('/spaces/:id', authorizeRoles('admin'), parkingController.deleteParkingSpace);

module.exports = router; 