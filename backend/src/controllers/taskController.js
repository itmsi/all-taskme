const { query } = require('../database/connection');

// Get all tasks for a project
const getProjectTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status_id, priority, assigned_to } = req.query;

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

    let whereClause = 't.project_id = $1';
    let params = [projectId];
    let paramCount = 1;

    if (status_id) {
      paramCount++;
      whereClause += ` AND t.status_id = $${paramCount}`;
      params.push(status_id);
    }

    if (priority) {
      paramCount++;
      whereClause += ` AND t.priority = $${paramCount}`;
      params.push(priority);
    }

    if (assigned_to) {
      paramCount++;
      whereClause += ` AND EXISTS (SELECT 1 FROM task_members tm WHERE tm.task_id = t.id AND tm.user_id = $${paramCount})`;
      params.push(assigned_to);
    }

    const result = await query(`
      SELECT 
        t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
        t.created_at, t.updated_at,
        ts.id as status_id, ts.name as status_name, ts.color as status_color,
        u.full_name as created_by_name
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
    `, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar task'
    });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { title, description, status_id, priority = 'medium', due_date, estimated_hours, assigned_to, location_name, location_latitude, location_longitude, location_address } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Judul task diperlukan'
      });
    }

    // Check if user has permission to create tasks in this project
    const permissionCheck = await query(`
      SELECT p.id FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.id = $1 AND (p.created_by = $2 OR pc.role IN ('owner', 'collaborator'))
      LIMIT 1
    `, [projectId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk membuat task di project ini'
      });
    }

    // Check if location columns exist by trying a simple query first
    let hasLocationColumns = false;
    try {
      await query(`SELECT location_name FROM tasks LIMIT 1`);
      hasLocationColumns = true;
    } catch (error) {
      hasLocationColumns = false;
    }

    let result;
    if (hasLocationColumns) {
      result = await query(`
        INSERT INTO tasks (title, description, project_id, created_by, status_id, priority, due_date, estimated_hours, location_name, location_latitude, location_longitude, location_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, title, description, priority, due_date, estimated_hours, actual_hours, location_name, location_latitude, location_longitude, location_address, created_at
      `, [title, description, projectId, userId, status_id || null, priority, due_date || null, estimated_hours || null, location_name, location_latitude || null, location_longitude || null, location_address]);
    } else {
      result = await query(`
        INSERT INTO tasks (title, description, project_id, created_by, status_id, priority, due_date, estimated_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, description, priority, due_date, estimated_hours, actual_hours, created_at
      `, [title, description, projectId, userId, status_id || null, priority, due_date || null, estimated_hours || null]);
    }

    const taskId = result.rows[0].id;

    // Assign task to users if provided
    if (assigned_to && Array.isArray(assigned_to)) {
      for (const userIdToAssign of assigned_to) {
        await query(`
          INSERT INTO task_members (task_id, user_id)
          VALUES ($1, $2)
        `, [taskId, userIdToAssign]);

        // Send notification to assigned user
        await query(`
          INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          userIdToAssign,
          'Task Ditugaskan',
          `Anda ditugaskan ke task "${title}"`,
          'task_assigned',
          taskId,
          'task'
        ]);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Task berhasil dibuat',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat task'
    });
  }
};

// Get task by ID with detailed information
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if user has access to this task (admin can access all tasks)
    if (userRole !== 'admin') {
      const accessCheck = await query(`
        SELECT t.id FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN task_members tm ON t.id = tm.task_id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
        LIMIT 1
      `, [taskId, userId]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak ke task ini'
        });
      }
    }

    // First get basic task info - check if location columns exist
    let taskResult;
    try {
      taskResult = await query(`
        SELECT 
          t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
          t.created_at, t.updated_at,
          COALESCE(t.location_name, '') as location_name, 
          COALESCE(t.location_latitude::text, '') as location_latitude, 
          COALESCE(t.location_longitude::text, '') as location_longitude, 
          COALESCE(t.location_address, '') as location_address,
          ts.id as status_id, ts.name as status_name, ts.color as status_color,
          p.id as project_id, p.name as project_name,
          u.full_name as created_by_name
        FROM tasks t
        LEFT JOIN task_statuses ts ON t.status_id = ts.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [taskId]);
    } catch (error) {
      // If location columns don't exist, use basic query
      taskResult = await query(`
        SELECT 
          t.id, t.title, t.description, t.priority, t.due_date, t.estimated_hours, t.actual_hours,
          t.created_at, t.updated_at,
          '' as location_name, '' as location_latitude, '' as location_longitude, '' as location_address,
          ts.id as status_id, ts.name as status_name, ts.color as status_color,
          p.id as project_id, p.name as project_name,
          u.full_name as created_by_name
        FROM tasks t
        LEFT JOIN task_statuses ts ON t.status_id = ts.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [taskId]);
    }

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task tidak ditemukan'
      });
    }

    // Then get task members
    const membersResult = await query(`
      SELECT 
        tm.user_id as id,
        u.full_name,
        u.avatar_url,
        tm.assigned_at
      FROM task_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.task_id = $1
    `, [taskId]);

    const task = taskResult.rows[0];
    task.members = membersResult.rows;

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data task'
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { title, description, status_id, priority, due_date, estimated_hours, actual_hours, location_name, location_latitude, location_longitude, location_address } = req.body;


    // Check if user has permission to update this task
    const permissionCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengupdate task ini'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }
    if (status_id !== undefined) {
      updateFields.push(`status_id = $${paramCount}`);
      params.push(status_id);
      paramCount++;
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }
    if (due_date !== undefined) {
      updateFields.push(`due_date = $${paramCount}`);
      params.push(due_date === '' ? null : due_date);
      paramCount++;
    }
    if (estimated_hours !== undefined) {
      updateFields.push(`estimated_hours = $${paramCount}`);
      params.push(estimated_hours === '' ? null : estimated_hours);
      paramCount++;
    }
    if (actual_hours !== undefined) {
      updateFields.push(`actual_hours = $${paramCount}`);
      params.push(actual_hours);
      paramCount++;
    }
    // Check if location columns exist in the database
    let hasLocationColumns = false;
    try {
      await query(`SELECT location_name FROM tasks LIMIT 1`);
      hasLocationColumns = true;
    } catch (error) {
      hasLocationColumns = false;
    }

    // Only add location fields if they exist in the database
    if (hasLocationColumns) {
      if (location_name !== undefined) {
        updateFields.push(`location_name = $${paramCount}`);
        params.push(location_name);
        paramCount++;
      }
      if (location_latitude !== undefined) {
        updateFields.push(`location_latitude = $${paramCount}`);
        params.push(location_latitude === '' ? null : location_latitude);
        paramCount++;
      }
      if (location_longitude !== undefined) {
        updateFields.push(`location_longitude = $${paramCount}`);
        params.push(location_longitude === '' ? null : location_longitude);
        paramCount++;
      }
      if (location_address !== undefined) {
        updateFields.push(`location_address = $${paramCount}`);
        params.push(location_address);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada field yang diupdate'
      });
    }

    params.push(taskId);
    const result = await query(`
      UPDATE tasks 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, title, description, priority, due_date, estimated_hours, actual_hours, updated_at
    `, params);

    res.json({
      success: true,
      message: 'Task berhasil diupdate',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate task'
    });
  }
};

// Update task status (for Kanban drag and drop)
const updateTaskStatusKanban = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { status_id } = req.body;

    if (!status_id) {
      return res.status(400).json({
        success: false,
        message: 'Status ID diperlukan'
      });
    }

    // Check if user has permission to update this task (admin can update all tasks)
    if (req.user.role !== 'admin') {
      const permissionCheck = await query(`
        SELECT t.id FROM tasks t
        JOIN projects p ON t.project_id = p.id
        LEFT JOIN task_members tm ON t.id = tm.task_id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
        LIMIT 1
      `, [taskId, userId]);

      if (permissionCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki izin untuk mengupdate task ini'
        });
      }
    }

    // Verify status exists and belongs to the same project
    const statusCheck = await query(`
      SELECT ts.id FROM task_statuses ts
      JOIN tasks t ON ts.project_id = t.project_id OR ts.is_default = true
      WHERE ts.id = $1 AND t.id = $2
      LIMIT 1
    `, [status_id, taskId]);

    if (statusCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid untuk project ini'
      });
    }

    const result = await query(`
      UPDATE tasks 
      SET status_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, title, status_id, updated_at
    `, [status_id, taskId]);

    res.json({
      success: true,
      message: 'Status task berhasil diupdate',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate status task'
    });
  }
};

// Update task order (for Kanban reordering)
const updateTaskOrder = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { tasks } = req.body; // Array of { id, position }

    if (!Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Data tasks harus berupa array'
      });
    }

    // Check if user has permission to update tasks in this project
    const permissionCheck = await query(`
      SELECT p.id FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.id = $1 AND (p.created_by = $2 OR pc.user_id = $2)
      LIMIT 1
    `, [projectId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengupdate tasks di project ini'
      });
    }

    // Update task positions in a transaction
    const client = await query('BEGIN');
    
    try {
      for (const task of tasks) {
        await query(`
          UPDATE tasks 
          SET position = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND project_id = $3
        `, [task.position, task.id, projectId]);
      }
      
      await query('COMMIT');
      
      res.json({
        success: true,
        message: 'Urutan tasks berhasil diupdate',
        data: { updated_count: tasks.length }
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update task order error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate urutan tasks'
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Check if user has permission to delete this task (project owner or task creator)
    const permissionCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND (p.created_by = $2 OR t.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus task ini'
      });
    }

    await query('DELETE FROM tasks WHERE id = $1', [taskId]);

    res.json({
      success: true,
      message: 'Task berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus task'
    });
  }
};

// Get task members
const getTaskMembers = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    const result = await query(`
      SELECT 
        tm.id, tm.assigned_at,
        u.id as user_id, u.email, u.full_name, u.avatar_url
      FROM task_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.task_id = $1
      ORDER BY tm.assigned_at ASC
    `, [taskId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get task members error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar member task'
    });
  }
};

// Add task member
const addTaskMember = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID diperlukan'
      });
    }

    // Check if user has permission to assign members to this task
    const permissionCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menambah member ke task ini'
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

    // Check if user is already a member
    const existingCheck = await query(
      'SELECT id FROM task_members WHERE task_id = $1 AND user_id = $2',
      [taskId, user_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User sudah menjadi member task ini'
      });
    }

    const result = await query(`
      INSERT INTO task_members (task_id, user_id)
      VALUES ($1, $2)
      RETURNING id, assigned_at
    `, [taskId, user_id]);

    // Send notification to assigned user
    await query(`
      INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      user_id,
      'Task Ditugaskan',
      `Anda ditugaskan ke task "${req.body.task_title || 'Unknown'}"`,
      'task_assigned',
      taskId,
      'task'
    ]);

    res.status(201).json({
      success: true,
      message: 'Member berhasil ditambahkan',
      data: {
        ...result.rows[0],
        user: userCheck.rows[0]
      }
    });
  } catch (error) {
    console.error('Add task member error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambah member'
    });
  }
};

// Remove task member
const removeTaskMember = async (req, res) => {
  try {
    const taskId = req.params.id;
    const memberId = req.params.userId;
    const userId = req.user.id;

    // Check if user has permission to remove members from this task
    const permissionCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus member dari task ini'
      });
    }

    const result = await query(
      'DELETE FROM task_members WHERE task_id = $1 AND user_id = $2 RETURNING id',
      [taskId, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Member berhasil dihapus'
    });
  } catch (error) {
    console.error('Remove task member error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus member'
    });
  }
};

// Upload attachments
const uploadAttachments = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const result = await query(`
        INSERT INTO task_attachments (task_id, filename, original_name, file_path, file_size, mime_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, filename, original_name, file_size, mime_type, uploaded_at
      `, [
        taskId,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        userId
      ]);

      uploadedFiles.push(result.rows[0]);
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} file berhasil diupload`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Upload attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal upload attachment'
    });
  }
};

// Get task attachments
const getTaskAttachments = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    const result = await query(`
      SELECT 
        ta.id, ta.filename, ta.original_name, ta.file_size, ta.mime_type, ta.uploaded_at,
        u.full_name as uploaded_by_name
      FROM task_attachments ta
      LEFT JOIN users u ON ta.uploaded_by = u.id
      WHERE ta.task_id = $1
      ORDER BY ta.uploaded_at DESC
    `, [taskId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get task attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar attachments'
    });
  }
};

// Download attachment
const downloadAttachment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const attachmentId = req.params.attachmentId;
    const userId = req.user.id;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    const result = await query(`
      SELECT filename, original_name, file_path, mime_type, file_size
      FROM task_attachments
      WHERE id = $1 AND task_id = $2
    `, [attachmentId, taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    const attachment = result.rows[0];
    const fs = require('fs');
    const path = require('path');

    // Check if file exists
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan di server'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.setHeader('Content-Length', attachment.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(attachment.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal download file'
    });
  }
};

// Preview attachment (for images)
const previewAttachment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const attachmentId = req.params.attachmentId;
    const userId = req.user.id;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    const result = await query(`
      SELECT filename, original_name, file_path, mime_type, file_size
      FROM task_attachments
      WHERE id = $1 AND task_id = $2
    `, [attachmentId, taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan'
      });
    }

    const attachment = result.rows[0];
    const fs = require('fs');

    // Check if file exists
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'File tidak ditemukan di server'
      });
    }

    // Set headers for preview (no download)
    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('Content-Length', attachment.file_size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream the file
    const fileStream = fs.createReadStream(attachment.file_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Preview attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal preview file'
    });
  }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const attachmentId = req.params.attachmentId;
    const userId = req.user.id;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    // Get file info before deleting
    const fileResult = await query(`
      SELECT file_path FROM task_attachments WHERE id = $1 AND task_id = $2
    `, [attachmentId, taskId]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attachment tidak ditemukan'
      });
    }

    // Delete from database
    const result = await query(
      'DELETE FROM task_attachments WHERE id = $1 AND task_id = $2 RETURNING id',
      [attachmentId, taskId]
    );

    // Delete physical file
    const fs = require('fs');
    if (fs.existsSync(fileResult.rows[0].file_path)) {
      fs.unlinkSync(fileResult.rows[0].file_path);
    }

    res.json({
      success: true,
      message: 'Attachment berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus attachment'
    });
  }
};

// Get task comments (chat messages)
const getTaskComments = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT 
        tc.id, tc.message, tc.created_at,
        u.id as user_id, u.email, u.full_name, u.avatar_url
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at DESC
      LIMIT $2 OFFSET $3
    `, [taskId, limit, offset]);

    const countResult = await query(
      'SELECT COUNT(*) as total FROM task_comments WHERE task_id = $1',
      [taskId]
    );

    res.json({
      success: true,
      data: {
        comments: result.rows.reverse(), // Show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get task comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil komentar task'
    });
  }
};

// Create task comment
const createTaskComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pesan tidak boleh kosong'
      });
    }

    // Check if user has access to this task
    const accessCheck = await query(`
      SELECT t.id FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_members tm ON t.id = tm.task_id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE t.id = $1 AND (tm.user_id = $2 OR pc.user_id = $2 OR p.created_by = $2)
      LIMIT 1
    `, [taskId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke task ini'
      });
    }

    const result = await query(`
      INSERT INTO task_comments (task_id, user_id, message, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, message, created_at
    `, [taskId, userId, message.trim()]);

    // Get user info for the response
    const userResult = await query(`
      SELECT id, full_name, avatar_url
      FROM users
      WHERE id = $1
    `, [userId]);

    const comment = {
      id: result.rows[0].id,
      message: result.rows[0].message,
      created_at: result.rows[0].created_at,
      user_id: userId,
      full_name: userResult.rows[0].full_name,
      avatar_url: userResult.rows[0].avatar_url
    };

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Create task comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat komentar'
    });
  }
};

// Get task statuses for a project
const getTaskStatuses = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    // Check if user has access to this project (admin can access all projects)
    if (req.user.role !== 'admin') {
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
      SELECT id, name, color, position, is_default, created_at
      FROM task_statuses
      WHERE project_id = $1 OR is_default = true
      ORDER BY position ASC, created_at ASC
    `, [projectId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get task statuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar status task'
    });
  }
};

// Create task status
const createTaskStatus = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { name, color = '#6B7280', position } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama status diperlukan'
      });
    }

    // Check if user has permission to create statuses (project owner only)
    const permissionCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND created_by = $2',
      [projectId, userId]
    );

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Hanya pemilik project yang dapat membuat status baru'
      });
    }

    const result = await query(`
      INSERT INTO task_statuses (name, color, position, project_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, color, position, is_default, created_at
    `, [name, color, position || 0, projectId]);

    res.status(201).json({
      success: true,
      message: 'Status berhasil dibuat',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat status'
    });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const statusId = req.params.statusId;
    const userId = req.user.id;
    const { name, color, position } = req.body;

    // Check if user has permission to update this status
    const permissionCheck = await query(`
      SELECT ts.id FROM task_statuses ts
      JOIN projects p ON ts.project_id = p.id
      WHERE ts.id = $1 AND (p.created_by = $2 OR ts.is_default = false)
      LIMIT 1
    `, [statusId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengupdate status ini'
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
    if (color !== undefined) {
      updateFields.push(`color = $${paramCount}`);
      params.push(color);
      paramCount++;
    }
    if (position !== undefined) {
      updateFields.push(`position = $${paramCount}`);
      params.push(position);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada field yang diupdate'
      });
    }

    params.push(statusId);
    const result = await query(`
      UPDATE task_statuses 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, color, position, is_default, created_at
    `, params);

    res.json({
      success: true,
      message: 'Status berhasil diupdate',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate status'
    });
  }
};

// Delete task status
const deleteTaskStatus = async (req, res) => {
  try {
    const statusId = req.params.statusId;
    const userId = req.user.id;

    // Check if user has permission to delete this status
    const permissionCheck = await query(`
      SELECT ts.id FROM task_statuses ts
      JOIN projects p ON ts.project_id = p.id
      WHERE ts.id = $1 AND p.created_by = $2 AND ts.is_default = false
      LIMIT 1
    `, [statusId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus status ini'
      });
    }

    // Check if any tasks are using this status
    const taskCheck = await query(
      'SELECT COUNT(*) as count FROM tasks WHERE status_id = $1',
      [statusId]
    );

    if (parseInt(taskCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus status yang masih digunakan oleh task'
      });
    }

    await query('DELETE FROM task_statuses WHERE id = $1', [statusId]);

    res.json({
      success: true,
      message: 'Status berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus status'
    });
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatusKanban,
  updateTaskOrder,
  deleteTask,
  getTaskMembers,
  addTaskMember,
  removeTaskMember,
  uploadAttachments,
  getTaskAttachments,
  downloadAttachment,
  previewAttachment,
  deleteAttachment,
  getTaskComments,
  createTaskComment,
  getTaskStatuses,
  createTaskStatus,
  updateTaskStatus,
  deleteTaskStatus
};
