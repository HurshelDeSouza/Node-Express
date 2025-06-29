const express = require('express');
const logController = require('../controllers/logController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// GET /api/logs - Get logs with pagination and filters
router.get('/', logController.getLogs);

// GET /api/logs/stats - Get log statistics
router.get('/stats', logController.getLogStats);

// GET /api/logs/:id - Get specific log
router.get('/:id', logController.getLogById);

module.exports = router; 