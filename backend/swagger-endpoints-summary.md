# Swagger Endpoints Summary

## 🔓 Public Endpoints (No Auth Token Required)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### System
- `GET /health` - Health check endpoint

## 🔒 Protected Endpoints (Auth Token Required)

### Authentication
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/change-password` - Change user password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/` - Get users
- `GET /api/users/all` - Get all users
- `GET /api/users/:id` - Get user by ID

### Teams
- `GET /api/teams/` - Get user teams
- `POST /api/teams/` - Create team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `PUT /api/teams/:id/leader` - Update team leader
- `DELETE /api/teams/:id` - Delete team
- `GET /api/teams/:id/members` - Get team members
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member
- `PUT /api/teams/:id/members/:userId/role` - Update member role

### Projects
- `GET /api/projects/` - Get user projects
- `POST /api/projects/` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/collaborators` - Get project collaborators
- `POST /api/projects/:id/collaborators` - Add project collaborator
- `DELETE /api/projects/:id/collaborators/:userId` - Remove project collaborator
- `GET /api/projects/:id/analytics` - Get project analytics

### Tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks/project/:projectId` - Create task
- `POST /api/tasks/project/:projectId/with-extensions` - Create task with extensions
- `GET /api/tasks/statuses/project/:projectId` - Get task statuses
- `POST /api/tasks/statuses/project/:projectId` - Create task status
- `PUT /api/tasks/statuses/:id` - Update task status
- `DELETE /api/tasks/statuses/:id` - Delete task status
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/status` - Update task status (Kanban)
- `PUT /api/tasks/project/:projectId/order` - Update task order
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/:id/members` - Get task members
- `POST /api/tasks/:id/members` - Add task member
- `DELETE /api/tasks/:id/members/:userId` - Remove task member
- `POST /api/tasks/:id/attachments` - Upload attachments
- `GET /api/tasks/:id/attachments` - Get task attachments
- `GET /api/tasks/:id/attachments/:attachmentId/download` - Download attachment
- `GET /api/tasks/:id/attachments/:attachmentId/preview` - Preview attachment
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Delete attachment
- `GET /api/tasks/:id/comments` - Get task comments
- `POST /api/tasks/:id/comments` - Create task comment
- `GET /api/tasks/:id/extensions` - Get task extensions
- `PUT /api/tasks/:id/extensions` - Update task extensions

### Notifications
- `GET /api/notifications/` - Get notifications
- `PUT /api/notifications/:id` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

### Analytics
- `GET /api/analytics/project/:id` - Get project analytics
- `GET /api/analytics/member/:id` - Get member analytics
- `GET /api/analytics/team/:id` - Get team analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics

## 🔧 How to Use

### For Public Endpoints:
- No authentication required
- Can be called directly from frontend
- Used for login, register, and health check

### For Protected Endpoints:
- Require Bearer token in Authorization header
- Format: `Authorization: Bearer <your-jwt-token>`
- Token obtained from login endpoint
