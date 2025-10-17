const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Get project analytics
router.get('/project/:id', authenticateToken, analyticsController.getProjectAnalytics);

// Get member analytics
router.get('/member/:id', authenticateToken, analyticsController.getMemberAnalytics);

// Get team analytics
router.get('/team/:id', authenticateToken, analyticsController.getTeamAnalytics);

// Get dashboard analytics
router.get('/dashboard', authenticateToken, analyticsController.getDashboardAnalytics);

module.exports = router;
