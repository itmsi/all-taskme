const { query } = require('../database/connection');

const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, username, email, full_name, avatar_url, role, is_active, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil profil',
      message: 'Terjadi kesalahan saat mengambil data profil'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url, username } = req.body;
    const userId = req.user.id;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Username sudah digunakan',
          message: 'Username yang Anda pilih sudah digunakan oleh user lain'
        });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }

    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCount}`);
      values.push(avatar_url);
      paramCount++;
    }

    if (username !== undefined) {
      updateFields.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada data yang diupdate',
        message: 'Minimal satu field harus diisi'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, full_name, avatar_url, role, is_active, updated_at
    `;

    const result = await query(updateQuery, values);

    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate profil',
      message: 'Terjadi kesalahan saat mengupdate profil'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_active = true';
    let values = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (full_name ILIKE $${paramCount} OR username ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get users
    const usersQuery = `
      SELECT id, username, email, full_name, avatar_url, role, created_at
      FROM users 
      ${whereClause}
      ORDER BY full_name ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await query(usersQuery, values);

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data users',
      message: 'Terjadi kesalahan saat mengambil data users'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, username, email, full_name, avatar_url, role, created_at 
       FROM users WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data user',
      message: 'Terjadi kesalahan saat mengambil data user'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUsers,
  getUserById
};
