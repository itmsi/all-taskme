const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const notificationController = require('../controllers/notificationController');

// Get user notifications
router.get('/', authenticateToken, notificationController.getNotifications);

// Mark notification as read
router.put('/:id', authenticateToken, validate(schemas.markNotificationRead), notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// Get unread count
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

module.exports = router;
