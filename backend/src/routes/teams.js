const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const teamController = require('../controllers/teamController');

/**
 * @swagger
 * /api/teams:
 *   get:
 *     tags: [Teams]
 *     summary: Get user's teams
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, teamController.getUserTeams);

/**
 * @swagger
 * /api/teams:
 *   post:
 *     tags: [Teams]
 *     summary: Create new team
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Development Team
 *               description:
 *                 type: string
 *                 example: Team untuk pengembangan aplikasi
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authenticateToken, validate(schemas.createTeam), teamController.createTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team by ID
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
 *     responses:
 *       200:
 *         description: Team retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', authenticateToken, teamController.getTeamById);

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     tags: [Teams]
 *     summary: Update team
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Team Name
 *               description:
 *                 type: string
 *                 example: Updated team description
 *     responses:
 *       200:
 *         description: Team updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', authenticateToken, validate(schemas.updateTeam), teamController.updateTeam);

/**
 * @swagger
 * /api/teams/{id}/leader:
 *   put:
 *     tags: [Teams]
 *     summary: Update team leader
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leader_id
 *             properties:
 *               leader_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Team leader updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/leader', authenticateToken, validate(schemas.updateTeamLeader), teamController.updateTeamLeader);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     tags: [Teams]
 *     summary: Delete team
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
 *     responses:
 *       200:
 *         description: Team deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authenticateToken, teamController.deleteTeam);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   get:
 *     tags: [Teams]
 *     summary: Get team members
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
 *     responses:
 *       200:
 *         description: Team members retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/members', authenticateToken, teamController.getTeamMembers);

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     tags: [Teams]
 *     summary: Add member to team
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               role:
 *                 type: string
 *                 enum: [leader, member, viewer]
 *                 default: member
 *                 example: member
 *     responses:
 *       201:
 *         description: Member added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/members', authenticateToken, validate(schemas.addTeamMember), teamController.addTeamMember);

/**
 * @swagger
 * /api/teams/{id}/members/{userId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Remove member from team
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id/members/:userId', authenticateToken, teamController.removeTeamMember);

/**
 * @swagger
 * /api/teams/{id}/members/{userId}/role:
 *   put:
 *     tags: [Teams]
 *     summary: Update member role
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [leader, member, viewer]
 *                 example: member
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/members/:userId/role', authenticateToken, teamController.updateMemberRole);

module.exports = router;
