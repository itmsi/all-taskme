const { query, transaction } = require('../database/connection');

const getUserTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT t.id, t.name, t.description, t.leader_id, t.created_at, t.updated_at,
              tm.role as user_role, tm.joined_at,
              u.username as leader_username, u.full_name as leader_name
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN users u ON t.leader_id = u.id
       WHERE tm.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      teams: result.rows
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data tim',
      message: 'Terjadi kesalahan saat mengambil data tim'
    });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const result = await transaction(async (client) => {
      // Create team
      const teamResult = await client.query(
        `INSERT INTO teams (name, description, leader_id) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, description, leader_id, created_at, updated_at`,
        [name, description, userId]
      );

      const team = teamResult.rows[0];

      // Add creator as team leader
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role) 
         VALUES ($1, $2, $3)`,
        [team.id, userId, 'leader']
      );

      return team;
    });

    res.status(201).json({
      success: true,
      message: 'Tim berhasil dibuat',
      team: result
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat tim',
      message: 'Terjadi kesalahan saat membuat tim'
    });
  }
};

const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is member of the team
    const memberCheck = await query(
      `SELECT tm.role FROM team_members tm 
       WHERE tm.team_id = $1 AND tm.user_id = $2`,
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Anda bukan anggota tim ini'
      });
    }

    const result = await query(
      `SELECT t.id, t.name, t.description, t.leader_id, t.created_at, t.updated_at,
              u.username as leader_username, u.full_name as leader_name
       FROM teams t
       LEFT JOIN users u ON t.leader_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tim tidak ditemukan'
      });
    }

    const team = result.rows[0];
    team.user_role = memberCheck.rows[0].role;

    res.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data tim',
      message: 'Terjadi kesalahan saat mengambil data tim'
    });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if user is leader of the team
    const leaderCheck = await query(
      `SELECT 1 FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = $1 AND tm.user_id = $2 AND tm.role = 'leader'`,
      [id, userId]
    );

    if (leaderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Hanya leader tim yang bisa mengupdate tim'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
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
    values.push(id);

    const updateQuery = `
      UPDATE teams 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, name, description, leader_id, created_at, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tim tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Tim berhasil diupdate',
      team: result.rows[0]
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate tim',
      message: 'Terjadi kesalahan saat mengupdate tim'
    });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is leader of the team
    const leaderCheck = await query(
      `SELECT 1 FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = $1 AND tm.user_id = $2 AND tm.role = 'leader'`,
      [id, userId]
    );

    if (leaderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Hanya leader tim yang bisa menghapus tim'
      });
    }

    const result = await query('DELETE FROM teams WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tim tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Tim berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus tim',
      message: 'Terjadi kesalahan saat menghapus tim'
    });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is member of the team
    const memberCheck = await query(
      `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Anda bukan anggota tim ini'
      });
    }

    const result = await query(
      `SELECT tm.id, tm.role, tm.joined_at,
              u.id as user_id, u.username, u.email, u.full_name, u.avatar_url
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1
       ORDER BY tm.role DESC, tm.joined_at ASC`,
      [id]
    );

    res.json({
      success: true,
      members: result.rows
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil anggota tim',
      message: 'Terjadi kesalahan saat mengambil anggota tim'
    });
  }
};

const addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;
    const currentUserId = req.user.id;

    // Check if current user is leader of the team
    const leaderCheck = await query(
      `SELECT 1 FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = $1 AND tm.user_id = $2 AND tm.role = 'leader'`,
      [id, currentUserId]
    );

    if (leaderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Hanya leader tim yang bisa menambah anggota'
      });
    }

    // Check if user exists and is active
    const userCheck = await query(
      'SELECT id, full_name FROM users WHERE id = $1 AND is_active = true',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User tidak ditemukan',
        message: 'User yang akan ditambahkan tidak ditemukan atau tidak aktif'
      });
    }

    // Check if user is already a member
    const existingMember = await query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User sudah menjadi anggota',
        message: 'User sudah menjadi anggota tim ini'
      });
    }

    const result = await query(
      `INSERT INTO team_members (team_id, user_id, role) 
       VALUES ($1, $2, $3) 
       RETURNING id, role, joined_at`,
      [id, user_id, role]
    );

    const member = result.rows[0];
    member.user = userCheck.rows[0];

    res.status(201).json({
      success: true,
      message: 'Anggota tim berhasil ditambahkan',
      member
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menambah anggota tim',
      message: 'Terjadi kesalahan saat menambah anggota tim'
    });
  }
};

const removeTeamMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const currentUserId = req.user.id;

    // Check if current user is leader of the team
    const leaderCheck = await query(
      `SELECT 1 FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = $1 AND tm.user_id = $2 AND tm.role = 'leader'`,
      [id, currentUserId]
    );

    if (leaderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Hanya leader tim yang bisa menghapus anggota'
      });
    }

    // Prevent removing team leader
    const memberRole = await query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberRole.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Anggota tidak ditemukan',
        message: 'User bukan anggota tim ini'
      });
    }

    if (memberRole.rows[0].role === 'leader') {
      return res.status(400).json({
        success: false,
        error: 'Tidak bisa menghapus leader',
        message: 'Leader tim tidak bisa dihapus'
      });
    }

    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Anggota tim berhasil dihapus'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus anggota tim',
      message: 'Terjadi kesalahan saat menghapus anggota tim'
    });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id;

    // Check if current user is leader of the team
    const leaderCheck = await query(
      `SELECT 1 FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE t.id = $1 AND tm.user_id = $2 AND tm.role = 'leader'`,
      [id, currentUserId]
    );

    if (leaderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Akses ditolak',
        message: 'Hanya leader tim yang bisa mengubah role anggota'
      });
    }

    const result = await query(
      `UPDATE team_members 
       SET role = $1 
       WHERE team_id = $2 AND user_id = $3 
       RETURNING id, role, joined_at`,
      [role, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Anggota tidak ditemukan',
        message: 'User bukan anggota tim ini'
      });
    }

    res.json({
      success: true,
      message: 'Role anggota berhasil diupdate',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate role anggota',
      message: 'Terjadi kesalahan saat mengupdate role anggota'
    });
  }
};

module.exports = {
  getUserTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateMemberRole
};
