const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const projectController = require('../controllers/projectController');

// Get user's projects
router.get('/', authenticateToken, projectController.getUserProjects);

// Create new project
router.post('/', authenticateToken, validate(schemas.createProject), projectController.createProject);

// Get project by ID
router.get('/:id', authenticateToken, projectController.getProjectById);

// Update project
router.put('/:id', authenticateToken, validate(schemas.updateProject), projectController.updateProject);

// Delete project
router.delete('/:id', authenticateToken, projectController.deleteProject);

// Get project collaborators
router.get('/:id/collaborators', authenticateToken, projectController.getProjectCollaborators);

// Add project collaborator
router.post('/:id/collaborators', authenticateToken, projectController.addProjectCollaborator);

// Remove project collaborator
router.delete('/:id/collaborators/:userId', authenticateToken, projectController.removeProjectCollaborator);

// Get project analytics
router.get('/:id/analytics', authenticateToken, projectController.getProjectAnalytics);

module.exports = router;
