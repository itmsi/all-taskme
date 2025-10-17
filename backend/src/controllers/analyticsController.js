const { query } = require('../database/connection');

// Get project analytics
const getProjectAnalytics = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

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
        COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_tasks,
        COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_tasks,
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
        u.id, u.username, u.full_name,
        COUNT(t.id) as tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        SUM(t.actual_hours) as total_hours_worked
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      LEFT JOIN task_members tm ON u.id = tm.user_id
      LEFT JOIN tasks t ON tm.task_id = t.id AND t.project_id = $1
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE pc.project_id = $1
      GROUP BY u.id, u.username, u.full_name
      ORDER BY tasks_assigned DESC
    `, [projectId]);

    // Get tasks created over time
    const tasksOverTime = await query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as tasks_created,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE t.project_id = $1 
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, [projectId]);

    res.json({
      success: true,
      data: {
        task_statistics: taskStats.rows[0],
        status_distribution: statusDistribution.rows,
        priority_distribution: priorityDistribution.rows,
        collaborator_activity: collaboratorActivity.rows,
        tasks_over_time: tasksOverTime.rows
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

// Get member analytics
const getMemberAnalytics = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const userId = req.user.id;
    const { period = '30' } = req.query;

    // Check if user has access to this member's data
    const accessCheck = await query(`
      SELECT u.id FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      JOIN teams t ON tm.team_id = t.id
      WHERE u.id = $1 AND (
        t.leader_id = $2 OR 
        EXISTS (SELECT 1 FROM team_members tm2 WHERE tm2.team_id = t.id AND tm2.user_id = $2)
      )
      LIMIT 1
    `, [memberId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke data member ini'
      });
    }

    // Get member's task statistics
    const taskStats = await query(`
      SELECT 
        COUNT(t.id) as total_tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND ts.name != 'Done' THEN 1 END) as overdue_tasks,
        AVG(t.actual_hours) as avg_hours_per_task,
        SUM(t.actual_hours) as total_hours_worked,
        SUM(t.estimated_hours) as total_hours_estimated
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `, [memberId]);

    // Get member's task distribution by priority
    const priorityDistribution = await query(`
      SELECT t.priority, COUNT(*) as count
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY t.priority
      ORDER BY CASE t.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
    `, [memberId]);

    // Get member's task distribution by status
    const statusDistribution = await query(`
      SELECT ts.name as status_name, ts.color, COUNT(*) as count
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY ts.name, ts.color
      ORDER BY ts.position
    `, [memberId]);

    // Get member's activity over time
    const activityOverTime = await query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        SUM(t.actual_hours) as hours_worked
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, [memberId]);

    // Get member's project participation
    const projectParticipation = await query(`
      SELECT 
        p.id, p.name, p.status,
        COUNT(t.id) as tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY p.id, p.name, p.status
      ORDER BY tasks_assigned DESC
    `, [memberId]);

    res.json({
      success: true,
      data: {
        task_statistics: taskStats.rows[0],
        priority_distribution: priorityDistribution.rows,
        status_distribution: statusDistribution.rows,
        activity_over_time: activityOverTime.rows,
        project_participation: projectParticipation.rows
      }
    });
  } catch (error) {
    console.error('Get member analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil analytics member'
    });
  }
};

// Get team analytics
const getTeamAnalytics = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const { period = '30' } = req.query;

    // Check if user has access to this team
    const accessCheck = await query(`
      SELECT t.id FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = $1 AND (t.leader_id = $2 OR tm.user_id = $2)
      LIMIT 1
    `, [teamId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak ke team ini'
      });
    }

    // Get team project statistics
    const projectStats = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
        AVG(progress) as avg_project_progress
      FROM projects
      WHERE team_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `, [teamId]);

    // Get team task statistics
    const taskStats = await query(`
      SELECT 
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND ts.name != 'Done' THEN 1 END) as overdue_tasks,
        AVG(t.actual_hours) as avg_hours_per_task,
        SUM(t.actual_hours) as total_hours_worked,
        SUM(t.estimated_hours) as total_hours_estimated
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE p.team_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `, [teamId]);

    // Get team member performance
    const memberPerformance = await query(`
      SELECT 
        u.id, u.username, u.full_name,
        COUNT(t.id) as tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        SUM(t.actual_hours) as total_hours_worked,
        CASE 
          WHEN COUNT(t.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN ts.name = 'Done' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100, 2)
          ELSE 0 
        END as completion_rate
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN task_members tmem ON u.id = tmem.user_id
      LEFT JOIN tasks t ON tmem.task_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.team_id = $1
        AND (t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days' OR t.created_at IS NULL)
      GROUP BY u.id, u.username, u.full_name
      ORDER BY tasks_completed DESC
    `, [teamId]);

    // Get team activity over time
    const activityOverTime = await query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(t.id) as tasks_created,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        COUNT(DISTINCT p.id) as projects_active
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE p.team_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, [teamId]);

    res.json({
      success: true,
      data: {
        project_statistics: projectStats.rows[0],
        task_statistics: taskStats.rows[0],
        member_performance: memberPerformance.rows,
        activity_over_time: activityOverTime.rows
      }
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil analytics team'
    });
  }
};

// Get dashboard analytics for user
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;

    // Get user's task overview
    const taskOverview = await query(`
      SELECT 
        COUNT(t.id) as total_tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND ts.name != 'Done' THEN 1 END) as overdue_tasks,
        COUNT(CASE WHEN t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND ts.name != 'Done' THEN 1 END) as due_this_week
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `, [userId]);

    // Get user's project overview
    const projectOverview = await query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects
      FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE (p.created_by = $1 OR pc.user_id = $1)
        AND p.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `, [userId]);

    // Get user's team overview
    const teamOverview = await query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_teams,
        COUNT(DISTINCT CASE WHEN t.leader_id = $1 THEN t.id END) as teams_leading
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE (t.leader_id = $1 OR tm.user_id = $1)
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `, [userId]);

    // Get recent activity
    const recentActivity = await query(`
      SELECT 
        'task' as type,
        t.id as related_id,
        t.title as title,
        'Task ditugaskan' as description,
        t.created_at as created_at
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      
      UNION ALL
      
      SELECT 
        'project' as type,
        p.id as related_id,
        p.name as title,
        'Ditambahkan ke project' as description,
        pc.added_at as created_at
      FROM project_collaborators pc
      JOIN projects p ON pc.project_id = p.id
      WHERE pc.user_id = $1
        AND pc.added_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    // Get user's productivity over time
    const productivityOverTime = await query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(t.id) as tasks_assigned,
        COUNT(CASE WHEN ts.name = 'Done' THEN 1 END) as tasks_completed,
        SUM(t.actual_hours) as hours_worked
      FROM task_members tm
      JOIN tasks t ON tm.task_id = t.id
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE tm.user_id = $1
        AND t.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, [userId]);

    res.json({
      success: true,
      data: {
        task_overview: taskOverview.rows[0],
        project_overview: projectOverview.rows[0],
        team_overview: teamOverview.rows[0],
        recent_activity: recentActivity.rows,
        productivity_over_time: productivityOverTime.rows
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil analytics dashboard'
    });
  }
};

module.exports = {
  getProjectAnalytics,
  getMemberAnalytics,
  getTeamAnalytics,
  getDashboardAnalytics
};
