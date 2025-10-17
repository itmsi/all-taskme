const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * /api/analytics/project/{id}:
 *   get:
 *     summary: Get project analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Project ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Period in days
 *     responses:
 *       200:
 *         description: Project analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     task_statistics:
 *                       type: object
 *                       properties:
 *                         total_tasks:
 *                           type: integer
 *                         completed_tasks:
 *                           type: integer
 *                         overdue_tasks:
 *                           type: integer
 *                         urgent_tasks:
 *                           type: integer
 *                         high_priority_tasks:
 *                           type: integer
 *                         avg_actual_hours:
 *                           type: number
 *                         total_actual_hours:
 *                           type: integer
 *                         total_estimated_hours:
 *                           type: integer
 *                     status_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status_name:
 *                             type: string
 *                           color:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     priority_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     collaborator_activity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           tasks_assigned:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *                           total_hours_worked:
 *                             type: integer
 *                     tasks_over_time:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           tasks_created:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/project/:id', authenticateToken, analyticsController.getProjectAnalytics);

/**
 * @swagger
 * /api/analytics/member/{id}:
 *   get:
 *     summary: Get member analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Member ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Period in days
 *     responses:
 *       200:
 *         description: Member analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     task_statistics:
 *                       type: object
 *                       properties:
 *                         total_tasks_assigned:
 *                           type: integer
 *                         tasks_completed:
 *                           type: integer
 *                         overdue_tasks:
 *                           type: integer
 *                         avg_hours_per_task:
 *                           type: number
 *                         total_hours_worked:
 *                           type: integer
 *                         total_hours_estimated:
 *                           type: integer
 *                     priority_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     status_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status_name:
 *                             type: string
 *                           color:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     activity_over_time:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           tasks_assigned:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *                           hours_worked:
 *                             type: integer
 *                     project_participation:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           tasks_assigned:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/member/:id', authenticateToken, analyticsController.getMemberAnalytics);

/**
 * @swagger
 * /api/analytics/team/{id}:
 *   get:
 *     summary: Get team analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Period in days
 *     responses:
 *       200:
 *         description: Team analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     project_statistics:
 *                       type: object
 *                       properties:
 *                         total_projects:
 *                           type: integer
 *                         active_projects:
 *                           type: integer
 *                         completed_projects:
 *                           type: integer
 *                         on_hold_projects:
 *                           type: integer
 *                         avg_project_progress:
 *                           type: number
 *                     task_statistics:
 *                       type: object
 *                       properties:
 *                         total_tasks:
 *                           type: integer
 *                         completed_tasks:
 *                           type: integer
 *                         overdue_tasks:
 *                           type: integer
 *                         avg_hours_per_task:
 *                           type: number
 *                         total_hours_worked:
 *                           type: integer
 *                         total_hours_estimated:
 *                           type: integer
 *                     member_performance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           tasks_assigned:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *                           total_hours_worked:
 *                             type: integer
 *                           completion_rate:
 *                             type: number
 *                     activity_over_time:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           tasks_created:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *                           projects_active:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/team/:id', authenticateToken, analyticsController.getTeamAnalytics);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics for user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Period in days
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     task_overview:
 *                       type: object
 *                       properties:
 *                         total_tasks_assigned:
 *                           type: integer
 *                         tasks_completed:
 *                           type: integer
 *                         overdue_tasks:
 *                           type: integer
 *                         due_this_week:
 *                           type: integer
 *                     project_overview:
 *                       type: object
 *                       properties:
 *                         total_projects:
 *                           type: integer
 *                         active_projects:
 *                           type: integer
 *                         completed_projects:
 *                           type: integer
 *                     team_overview:
 *                       type: object
 *                       properties:
 *                         total_teams:
 *                           type: integer
 *                         teams_leading:
 *                           type: integer
 *                     recent_activity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           related_id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     productivity_over_time:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           tasks_assigned:
 *                             type: integer
 *                           tasks_completed:
 *                             type: integer
 *                           hours_worked:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard', authenticateToken, analyticsController.getDashboardAnalytics);

module.exports = router;
