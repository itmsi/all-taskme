const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { uploadMultiple } = require('../utils/fileUpload');
const taskController = require('../controllers/taskController');

// Get project tasks
router.get('/project/:projectId', authenticateToken, taskController.getProjectTasks);

// Create new task
router.post('/project/:projectId', authenticateToken, validate(schemas.createTask), taskController.createTask);

// Get task by ID
router.get('/:id', authenticateToken, taskController.getTaskById);

// Update task
router.put('/:id', authenticateToken, validate(schemas.updateTask), taskController.updateTask);

// Delete task
router.delete('/:id', authenticateToken, taskController.deleteTask);

// Get task members
router.get('/:id/members', authenticateToken, taskController.getTaskMembers);

// Add task member
router.post('/:id/members', authenticateToken, taskController.addTaskMember);

// Remove task member
router.delete('/:id/members/:userId', authenticateToken, taskController.removeTaskMember);

// Upload task attachments
router.post('/:id/attachments', authenticateToken, uploadMultiple('attachments', 5), taskController.uploadAttachments);

// Delete task attachment
router.delete('/:id/attachments/:attachmentId', authenticateToken, taskController.deleteAttachment);

// Get task comments
router.get('/:id/comments', authenticateToken, taskController.getTaskComments);

// Task status management
router.get('/statuses/project/:projectId', authenticateToken, taskController.getTaskStatuses);
router.post('/statuses', authenticateToken, validate(schemas.createTaskStatus), taskController.createTaskStatus);
router.put('/statuses/:id', authenticateToken, validate(schemas.updateTaskStatus), taskController.updateTaskStatus);
router.delete('/statuses/:id', authenticateToken, taskController.deleteTaskStatus);

module.exports = router;
