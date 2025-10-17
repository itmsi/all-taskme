const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

const setupSocket = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user data
      const userResult = await query(
        'SELECT id, username, email, full_name, avatar_url FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected with socket ${socket.id}`);

    // Join task room for chat
    socket.on('join_task', async (taskId) => {
      try {
        // Verify user has access to this task
        const taskResult = await query(
          `SELECT t.id FROM tasks t
           LEFT JOIN task_members tm ON t.id = tm.task_id
           LEFT JOIN projects p ON t.project_id = p.id
           LEFT JOIN team_members tmem ON p.team_id = tmem.team_id
           WHERE t.id = $1 AND (tm.user_id = $2 OR tmem.user_id = $2 OR p.created_by = $2)
           LIMIT 1`,
          [taskId, socket.userId]
        );

        if (taskResult.rows.length === 0) {
          socket.emit('error', { message: 'Access denied to this task' });
          return;
        }

        const roomName = `task_${taskId}`;
        socket.join(roomName);
        socket.emit('joined_task', { taskId, roomName });
        
        console.log(`User ${socket.user.username} joined task room: ${roomName}`);
      } catch (error) {
        console.error('Join task error:', error);
        socket.emit('error', { message: 'Failed to join task room' });
      }
    });

    // Leave task room
    socket.on('leave_task', (taskId) => {
      const roomName = `task_${taskId}`;
      socket.leave(roomName);
      socket.emit('left_task', { taskId, roomName });
      console.log(`User ${socket.user.username} left task room: ${roomName}`);
    });

    // Send message in task chat
    socket.on('send_message', async (data) => {
      try {
        const { taskId, message } = data;

        if (!taskId || !message || message.trim().length === 0) {
          socket.emit('error', { message: 'Task ID and message are required' });
          return;
        }

        // Verify user has access to this task
        const taskResult = await query(
          `SELECT t.id FROM tasks t
           LEFT JOIN task_members tm ON t.id = tm.task_id
           LEFT JOIN projects p ON t.project_id = p.id
           LEFT JOIN team_members tmem ON p.team_id = tmem.team_id
           WHERE t.id = $1 AND (tm.user_id = $2 OR tmem.user_id = $2 OR p.created_by = $2)
           LIMIT 1`,
          [taskId, socket.userId]
        );

        if (taskResult.rows.length === 0) {
          socket.emit('error', { message: 'Access denied to this task' });
          return;
        }

        // Save message to database
        const messageResult = await query(
          `INSERT INTO task_comments (task_id, user_id, message)
           VALUES ($1, $2, $3)
           RETURNING id, created_at`,
          [taskId, socket.userId, message.trim()]
        );

        const savedMessage = {
          id: messageResult.rows[0].id,
          task_id: taskId,
          user: {
            id: socket.user.id,
            username: socket.user.username,
            full_name: socket.user.full_name,
            avatar_url: socket.user.avatar_url
          },
          message: message.trim(),
          created_at: messageResult.rows[0].created_at
        };

        // Broadcast message to all users in the task room
        const roomName = `task_${taskId}`;
        io.to(roomName).emit('new_message', savedMessage);

        console.log(`Message sent in task ${taskId} by ${socket.user.username}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Task assignment notification
    socket.on('task_assigned', async (data) => {
      try {
        const { taskId, assignedUserId } = data;

        // Verify the task exists and user has permission to assign
        const taskResult = await query(
          `SELECT t.title, p.name as project_name FROM tasks t
           JOIN projects p ON t.project_id = p.id
           WHERE t.id = $1`,
          [taskId]
        );

        if (taskResult.rows.length === 0) {
          socket.emit('error', { message: 'Task not found' });
          return;
        }

        const task = taskResult.rows[0];

        // Create notification
        await query(
          `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            assignedUserId,
            'Task Assigned',
            `Anda ditugaskan ke task "${task.title}" di project "${task.project_name}"`,
            'task_assigned',
            taskId,
            'task'
          ]
        );

        // Send notification to assigned user if they're online
        io.to(`user_${assignedUserId}`).emit('notification', {
          title: 'Task Assigned',
          message: `Anda ditugaskan ke task "${task.title}"`,
          type: 'task_assigned'
        });

        console.log(`Task ${taskId} assigned to user ${assignedUserId}`);
      } catch (error) {
        console.error('Task assignment error:', error);
        socket.emit('error', { message: 'Failed to assign task' });
      }
    });

    // Join user's personal notification room
    socket.on('join_notifications', () => {
      const roomName = `user_${socket.userId}`;
      socket.join(roomName);
      socket.emit('joined_notifications', { roomName });
      console.log(`User ${socket.user.username} joined notifications room: ${roomName}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });

  return io;
};

module.exports = {
  setupSocket
};
