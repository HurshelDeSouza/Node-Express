const express = require('express');
const reservationController = require('../controllers/reservationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/reservations - Create reservation
router.post('/', reservationController.createReservation);

// GET /api/reservations - List reservations
router.get('/', reservationController.getReservations);

// GET /api/reservations/:id - Get reservation by ID
router.get('/:id', reservationController.getReservationById);

// PUT /api/reservations/:id - Update reservation
router.put('/:id', reservationController.updateReservation);

// DELETE /api/reservations/:id - Cancel reservation
router.delete('/:id', reservationController.cancelReservation);

module.exports = router; 