import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9561/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
}

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
}

// Teams API
export const teamsAPI = {
  getUserTeams: () => api.get('/teams'),
  createTeam: (teamData) => api.post('/teams', teamData),
  getTeamById: (id) => api.get(`/teams/${id}`),
  updateTeam: (id, teamData) => api.put(`/teams/${id}`, teamData),
  deleteTeam: (id) => api.delete(`/teams/${id}`),
  getTeamMembers: (id) => api.get(`/teams/${id}/members`),
  addTeamMember: (id, memberData) => api.post(`/teams/${id}/members`, memberData),
  removeTeamMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  updateMemberRole: (id, userId, roleData) => api.put(`/teams/${id}/members/${userId}/role`, roleData),
}

// Projects API
export const projectsAPI = {
  getUserProjects: () => api.get('/projects'),
  createProject: (projectData) => api.post('/projects', projectData),
  getProjectById: (id) => api.get(`/projects/${id}`),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getProjectCollaborators: (id) => api.get(`/projects/${id}/collaborators`),
  addProjectCollaborator: (id, collaboratorData) => api.post(`/projects/${id}/collaborators`, collaboratorData),
  removeProjectCollaborator: (id, userId) => api.delete(`/projects/${id}/collaborators/${userId}`),
  getProjectAnalytics: (id) => api.get(`/projects/${id}/analytics`),
}

// Tasks API
export const tasksAPI = {
  getProjectTasks: (projectId) => api.get(`/tasks/project/${projectId}`),
  createTask: (projectId, taskData) => api.post(`/tasks/project/${projectId}`, taskData),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getTaskMembers: (id) => api.get(`/tasks/${id}/members`),
  addTaskMember: (id, memberData) => api.post(`/tasks/${id}/members`, memberData),
  removeTaskMember: (id, userId) => api.delete(`/tasks/${id}/members/${userId}`),
  uploadAttachments: (id, formData) => api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAttachment: (id, attachmentId) => api.delete(`/tasks/${id}/attachments/${attachmentId}`),
  getTaskComments: (id) => api.get(`/tasks/${id}/comments`),
  getTaskStatuses: (projectId) => api.get(`/tasks/statuses/project/${projectId}`),
  createTaskStatus: (statusData) => api.post('/tasks/statuses', statusData),
  updateTaskStatus: (id, statusData) => api.put(`/tasks/statuses/${id}`, statusData),
  deleteTaskStatus: (id) => api.delete(`/tasks/statuses/${id}`),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id, isRead) => api.put(`/notifications/${id}`, { is_read: isRead }),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// Analytics API
export const analyticsAPI = {
  getProjectAnalytics: (id) => api.get(`/analytics/project/${id}`),
  getMemberAnalytics: (id) => api.get(`/analytics/member/${id}`),
  getTeamAnalytics: (id) => api.get(`/analytics/team/${id}`),
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
}
