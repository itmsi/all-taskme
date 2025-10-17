const { query } = require('../database/connection');

// Get user notifications with pagination
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, is_read } = req.query;

    let whereClause = 'n.user_id = $1';
    let params = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND n.type = $${paramCount}`;
      params.push(type);
    }

    if (is_read !== undefined) {
      paramCount++;
      whereClause += ` AND n.is_read = $${paramCount}`;
      params.push(is_read === 'true');
    }

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await query(`
      SELECT 
        n.id, n.title, n.message, n.type, n.is_read, n.related_id, n.related_type,
        n.created_at
      FROM notifications n
      WHERE ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    const countResult = await query(`
      SELECT COUNT(*) as total FROM notifications n
      WHERE ${whereClause}
    `, params.slice(0, paramCount));

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil notifikasi'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const result = await query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING id, title, message, type, is_read, created_at
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Notifikasi berhasil ditandai sebagai dibaca',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menandai notifikasi sebagai dibaca'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;

    let whereClause = 'user_id = $1';
    let params = [userId];

    if (type) {
      params.push(type);
      whereClause += ' AND type = $2';
    }

    const result = await query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE ${whereClause}
      RETURNING COUNT(*) as updated_count
    `, params);

    res.json({
      success: true,
      message: 'Semua notifikasi berhasil ditandai sebagai dibaca',
      data: {
        updated_count: result.rows[0]?.updated_count || 0
      }
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menandai semua notifikasi sebagai dibaca'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Notifikasi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus notifikasi'
    });
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let whereClause = 'user_id = $1 AND is_read = false';
    let params = [userId];

    if (type) {
      params.push(type);
      whereClause += ' AND type = $2';
    }

    const result = await query(`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE ${whereClause}
    `, params);

    res.json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].unread_count)
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil jumlah notifikasi belum dibaca'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
