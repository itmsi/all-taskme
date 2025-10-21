# 📚 TaskMe API Documentation

## Base URL
```
http://localhost:9561/api
```

## Authentication
Semua endpoint kecuali register dan login memerlukan JWT token di header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
Semua response menggunakan format JSON dengan struktur:
```json
{
  "success": true,
  "message": "Optional message",
  "data": {}, // atau array untuk list data
  "pagination": {} // untuk response dengan pagination
}
```

## Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [] // untuk validation errors
}
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string (required, 3-30 chars, alphanumeric + underscore)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "full_name": "string (required, 2-100 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "avatar_url": "string",
    "role": "user|admin",
    "is_active": true,
    "created_at": "datetime"
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "avatar_url": "string",
    "role": "user|admin",
    "is_active": true
  }
}
```

### Get Profile
```http
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "full_name": "string",
    "avatar_url": "string",
    "role": "user|admin",
    "is_active": true,
    "created_at": "datetime"
  }
}
```

### Change Password
```http
PUT /auth/change-password
```

**Request Body:**
```json
{
  "current_password": "string (required)",
  "new_password": "string (required, min 6 chars)"
}
```

### Logout
```http
POST /auth/logout
```

---

## 👥 User Endpoints

### Get Users
```http
GET /users?search=string&page=1&limit=20
```

**Query Parameters:**
- `search` (optional): Search by name or username
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

### Get User by ID
```http
GET /users/{id}
```

### Update Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "full_name": "string (optional)",
  "avatar_url": "string (optional)",
  "username": "string (optional, unique)"
}
```

---

## 🏢 Team Endpoints

### Get User Teams
```http
GET /teams
```

### Create Team
```http
POST /teams
```

**Request Body:**
```json
{
  "name": "string (required, 2-100 chars)",
  "description": "string (optional, max 500 chars)"
}
```

### Get Team by ID
```http
GET /teams/{id}
```

### Update Team
```http
PUT /teams/{id}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

### Delete Team
```http
DELETE /teams/{id}
```

### Get Team Members
```http
GET /teams/{id}/members
```

### Add Team Member
```http
POST /teams/{id}/members
```

**Request Body:**
```json
{
  "user_id": "uuid (required)",
  "role": "leader|member|viewer (default: member)"
}
```

### Remove Team Member
```http
DELETE /teams/{id}/members/{userId}
```

### Update Member Role
```http
PUT /teams/{id}/members/{userId}/role
```

**Request Body:**
```json
{
  "role": "leader|member|viewer (required)"
}
```

---

## 📁 Project Endpoints

### Get User Projects
```http
GET /projects
```

### Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "name": "string (required, 2-100 chars)",
  "description": "string (optional, max 1000 chars)",
  "start_date": "date (optional, ISO format)",
  "end_date": "date (optional, ISO format, must be after start_date)",
  "team_id": "uuid (required)"
}
```

### Get Project by ID
```http
GET /projects/{id}
```

### Update Project
```http
PUT /projects/{id}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "active|completed|on_hold|cancelled (optional)",
  "start_date": "date (optional)",
  "end_date": "date (optional)"
}
```

### Delete Project
```http
DELETE /projects/{id}
```

### Get Project Collaborators
```http
GET /projects/{id}/collaborators
```

### Add Project Collaborator
```http
POST /projects/{id}/collaborators
```

**Request Body:**
```json
{
  "user_id": "uuid (required)",
  "role": "owner|collaborator|viewer (default: collaborator)"
}
```

### Remove Project Collaborator
```http
DELETE /projects/{id}/collaborators/{userId}
```

### Get Project Analytics
```http
GET /projects/{id}/analytics
```

---

## 📝 Task Endpoints

### Get Project Tasks
```http
GET /tasks/project/{projectId}
```

### Create Task
```http
POST /tasks/project/{projectId}
```

**Request Body:**
```json
{
  "title": "string (required, 2-200 chars)",
  "description": "string (optional, max 2000 chars)",
  "priority": "low|medium|high|urgent (default: medium)",
  "due_date": "datetime (optional, ISO format)",
  "estimated_hours": "integer (optional, min 0)",
  "status_id": "uuid (optional)"
}
```

### Get Task by ID
```http
GET /tasks/{id}
```

### Update Task
```http
PUT /tasks/{id}
```

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "priority": "low|medium|high|urgent (optional)",
  "due_date": "datetime (optional)",
  "estimated_hours": "integer (optional)",
  "actual_hours": "integer (optional)",
  "status_id": "uuid (optional)"
}
```

### Delete Task
```http
DELETE /tasks/{id}
```

### Get Task Members
```http
GET /tasks/{id}/members
```

### Add Task Member
```http
POST /tasks/{id}/members
```

**Request Body:**
```json
{
  "user_id": "uuid (required)"
}
```

### Remove Task Member
```http
DELETE /tasks/{id}/members/{userId}
```

### Upload Task Attachments
```http
POST /tasks/{id}/attachments
Content-Type: multipart/form-data
```

**Form Data:**
- `attachments`: File array (max 5 files, 10MB each)

### Delete Task Attachment
```http
DELETE /tasks/{id}/attachments/{attachmentId}
```

### Get Task Comments
```http
GET /tasks/{id}/comments
```

### Task Status Management

#### Get Task Statuses
```http
GET /tasks/statuses/project/{projectId}
```

#### Create Task Status
```http
POST /tasks/statuses
```

**Request Body:**
```json
{
  "name": "string (required, 2-50 chars)",
  "color": "string (optional, hex color, default: #6B7280)",
  "position": "integer (optional, default: 0)"
}
```

#### Update Task Status
```http
PUT /tasks/statuses/{id}
```

#### Delete Task Status
```http
DELETE /tasks/statuses/{id}
```

---

## 🔔 Notification Endpoints

### Get Notifications
```http
GET /notifications
```

### Mark Notification as Read
```http
PUT /notifications/{id}
```

**Request Body:**
```json
{
  "is_read": "boolean (required)"
}
```

### Mark All Notifications as Read
```http
PUT /notifications/mark-all-read
```

### Delete Notification
```http
DELETE /notifications/{id}
```

### Get Unread Count
```http
GET /notifications/unread-count
```

---

## 📊 Analytics Endpoints

### Get Project Analytics
```http
GET /analytics/project/{id}
```

### Get Member Analytics
```http
GET /analytics/member/{id}
```

### Get Team Analytics
```http
GET /analytics/team/{id}
```

### Get Dashboard Analytics
```http
GET /analytics/dashboard
```

---

## 🔌 Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:9561', {
  auth: {
    token: 'your-jwt-token'
  }
})
```

### Join Task Room
```javascript
socket.emit('join_task', taskId)
```

### Leave Task Room
```javascript
socket.emit('leave_task', taskId)
```

### Send Message
```javascript
socket.emit('send_message', { taskId, message })
```

### Listen for New Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message)
})
```

### Listen for Notifications
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification)
})
```

---

## 📋 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## 🔧 Development Tools

### API Testing
Gunakan file `test-api.http` dengan VS Code REST Client extension untuk testing API.

### Swagger Documentation
Akses dokumentasi interaktif di: http://localhost:9561/api-docs

### Health Check
```http
GET http://localhost:9561/health
```
