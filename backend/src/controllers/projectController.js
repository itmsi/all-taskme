const { query } = require('../database/connection');

// Get all projects for a user (projects they created or are collaborators in)
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { team_id, status } = req.query;

    let whereClause, params, paramCount;

    if (userRole === 'admin') {
      // Admin can see all projects
      whereClause = '1=1';
      params = [];
      paramCount = 0;
    } else {
      // Regular users can only see projects they created or are collaborators in
      whereClause = `(p.created_by = $1::uuid OR EXISTS (
        SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = $1::uuid
      ))`;
      params = [userId];
      paramCount = 1;
    }

    if (team_id) {
      paramCount++;
      whereClause += ` AND p.team_id = $${paramCount}`;
      params.push(team_id);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    const result = await query(`
      SELECT 
        p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.progress,
        p.created_at, p.updated_at,
        t.id as team_id, t.name as team_name,
        u.full_name as created_by_name,
        CASE WHEN $1 = 'admin' THEN 'admin'
             WHEN p.created_by = $2::uuid THEN 'owner' 
             ELSE pc.role END as user_role
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = $2::uuid
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
    `, [userRole, userId, ...params]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar project'
    });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, team_id, start_date, end_date } = req.body;

    if (!name || !team_id) {
      return res.status(400).json({
        success: false,
        message: 'Nama project dan team ID diperlukan'
      });
    }

    // Verify user is member of the team (admin can bypass this check)
    if (req.user.role !== 'admin') {
      const teamCheck = await query(
        'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team_id, userId]
      );

      if (teamCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Anda bukan anggota team ini'
        });
      }
    }

    const result = await query(`
      INSERT INTO projects (name, description, team_id, created_by, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, status, start_date, end_date, progress, created_at
    `, [name, description, team_id, userId, start_date || null, end_date || null]);

    // Add creator as project owner
    await query(`
      INSERT INTO project_collaborators (project_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `, [result.rows[0].id, userId]);

    res.status(201).json({
      success: true,
      message: 'Project berhasil dibuat',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat project'
    });
  }
};

// Get project by ID with detailed information
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to this project (admin can access all projects)
    if (userRole !== 'admin') {
      const accessCheck = await query(`
        SELECT p.id FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.id = $1 AND (p.created_by = $2 OR pc.user_id = $2)
        LIMIT 1
      `, [projectId, userId]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak ke project ini'
        });
      }
    }

    const result = await query(`
      SELECT 
        p.id, p.name, p.description, p.status, p.start_date, p.end_date, p.progress,
        p.created_at, p.updated_at,
        t.id as team_id, t.name as team_name, t.description as team_description,
        u.id as created_by_id, u.full_name as created_by_name,
        CASE WHEN $3 = 'admin' THEN 'admin'
             WHEN p.created_by = $2 THEN 'owner' 
             ELSE pc.role END as user_role
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = $2
      WHERE p.id = $1
    `, [projectId, userId, userRole]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data project'
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { name, description, status, start_date, end_date, progress } = req.body;

    // Check if user has permission to update (owner or collaborator with edit rights)
    const permissionCheck = await query(`
      SELECT p.id, p.created_by, pc.role
      FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = $2
      WHERE p.id = $1 AND (p.created_by = $2 OR pc.role IN ('owner', 'collaborator'))
      LIMIT 1
    `, [projectId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengupdate project ini'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (start_date !== undefined) {
      updateFields.push(`start_date = $${paramCount}`);
      params.push(start_date);
      paramCount++;
    }
    if (end_date !== undefined) {
      updateFields.push(`end_date = $${paramCount}`);
      params.push(end_date);
      paramCount++;
    }
    if (progress !== undefined) {
      updateFields.push(`progress = $${paramCount}`);
      params.push(progress);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada field yang diupdate'
      });
    }

    params.push(projectId);
    const result = await query(`
      UPDATE projects 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, name, description, status, start_date, end_date, progress, updated_at
    `, params);

    res.json({
      success: true,
      message: 'Project berhasil diupdate',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate project'
    });
  }
};

// Delete project (only owner can delete)
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Check if user is the owner
    const ownerCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [projectId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Hanya pemilik project yang dapat menghapus project'
      });
    }

    await query('DELETE FROM projects WHERE id = $1', [projectId]);

    res.json({
      success: true,
      message: 'Project berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus project'
    });
  }
};

// Get project collaborators
const getProjectCollaborators = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this project
    const accessCheck = await query(`
      SELECT p.id FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.id = $1 AND (p.created_by = $2 OR pc.user_id = $2)
      LIMIT 1
    `, [projectId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke project ini'
      });
    }

    const result = await query(`
      SELECT 
        pc.id, pc.role, pc.added_at,
        u.id as user_id, u.email, u.full_name, u.avatar_url
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = $1
      ORDER BY pc.added_at ASC
    `, [projectId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get project collaborators error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar kolaborator'
    });
  }
};

// Add project collaborator
const addProjectCollaborator = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { user_id, role = 'collaborator' } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID diperlukan'
      });
    }

    // Check if user has permission to add collaborators (owner only)
    const permissionCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [projectId, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Hanya pemilik project yang dapat menambah kolaborator'
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
        message: 'User tidak ditemukan'
      });
    }

    // Check if user is already a collaborator
    const existingCheck = await query(
      'SELECT id FROM project_collaborators WHERE project_id = $1 AND user_id = $2',
      [projectId, user_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User sudah menjadi kolaborator project ini'
      });
    }

    const result = await query(`
      INSERT INTO project_collaborators (project_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, role, added_at
    `, [projectId, user_id, role]);

    // Send notification to added user
    await query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      user_id,
      'Ditambahkan ke Project',
      `Anda telah ditambahkan sebagai kolaborator di project "${req.body.project_name || 'Unknown'}"`,
      'project_collaborator_added',
      projectId,
      'project'
    ]);

    res.status(201).json({
      success: true,
      message: 'Kolaborator berhasil ditambahkan',
      data: {
        ...result.rows[0],
        user: userCheck.rows[0]
      }
    });
  } catch (error) {
    console.error('Add project collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambah kolaborator'
    });
  }
};

// Remove project collaborator
const removeProjectCollaborator = async (req, res) => {
  try {
    const projectId = req.params.id;
    const collaboratorId = req.params.collaboratorId;
    const userId = req.user.id;

    // Check if user has permission to remove collaborators (owner only)
    const permissionCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [projectId, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Hanya pemilik project yang dapat menghapus kolaborator'
      });
    }

    const result = await query(
      'DELETE FROM project_collaborators WHERE project_id = $1 AND user_id = $2 RETURNING id',
      [projectId, collaboratorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kolaborator tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Kolaborator berhasil dihapus'
    });
  } catch (error) {
    console.error('Remove project collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus kolaborator'
    });
  }
};

// Get project analytics
const getProjectAnalytics = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this project
    const accessCheck = await query(`
      SELECT p.id FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.id = $1 AND (p.created_by = $2 OR pc.user_id = $2)
      LIMIT 1
    `, [projectId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke project ini'
      });
    }

    // Get task statistics
    const taskStats = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND ts.name != 'Done' THEN 1 END) as overdue_tasks,
        AVG(t.actual_hours) as avg_actual_hours,
        SUM(t.actual_hours) as total_actual_hours,
        SUM(t.estimated_hours) as total_estimated_hours
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE t.project_id = $1
    `, [projectId]);

    // Get task status distribution
    const statusDistribution = await query(`
      SELECT ts.name as status_name, ts.color, COUNT(*) as count
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE t.project_id = $1
      GROUP BY ts.name, ts.color
      ORDER BY ts.position
    `, [projectId]);

    // Get priority distribution
    const priorityDistribution = await query(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      WHERE project_id = $1
      GROUP BY priority
      ORDER BY CASE priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
    `, [projectId]);

    // Get collaborator activity
    const collaboratorActivity = await query(`
      SELECT 
        u.id, u.email, u.full_name,
        COUNT(t.id) as tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      LEFT JOIN task_members tm ON u.id = tm.user_id
      LEFT JOIN tasks t ON tm.task_id = t.id AND t.project_id = $1
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE pc.project_id = $1
      GROUP BY u.id, u.email, u.full_name
      ORDER BY tasks_assigned DESC
    `, [projectId]);

    res.json({
      success: true,
      data: {
        task_statistics: taskStats.rows[0],
        status_distribution: statusDistribution.rows,
        priority_distribution: priorityDistribution.rows,
        collaborator_activity: collaboratorActivity.rows
      }
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil analytics project'
    });
  }
};

module.exports = {
  getUserProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectCollaborators,
  addProjectCollaborator,
  removeProjectCollaborator,
  getProjectAnalytics
};
