// Placeholder controllers - implementasi lengkap akan dibuat nanti
const getNotifications = async (req, res) => {
  res.json({ success: true, message: 'Get notifications - coming soon' });
};

const markAsRead = async (req, res) => {
  res.json({ success: true, message: 'Mark notification as read - coming soon' });
};

const markAllAsRead = async (req, res) => {
  res.json({ success: true, message: 'Mark all notifications as read - coming soon' });
};

const deleteNotification = async (req, res) => {
  res.json({ success: true, message: 'Delete notification - coming soon' });
};

const getUnreadCount = async (req, res) => {
  res.json({ success: true, message: 'Get unread count - coming soon' });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
