const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // User schemas
  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100),
    avatar_url: Joi.string().uri(),
    username: Joi.string().alphanum().min(3).max(30)
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).required()
  }),

  // Team schemas
  createTeam: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500)
  }),

  updateTeam: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500)
  }),

  addTeamMember: Joi.object({
    user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('leader', 'member', 'viewer').default('member')
  }),

  // Project schemas
  createProject: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
    team_id: Joi.string().uuid().required()
  }),

  updateProject: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(1000),
    status: Joi.string().valid('active', 'completed', 'on_hold', 'cancelled'),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date'))
  }),

  // Task schemas
  createTask: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(2000),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    due_date: Joi.date().iso(),
    estimated_hours: Joi.number().integer().min(0),
    status_id: Joi.string().uuid()
  }),

  updateTask: Joi.object({
    title: Joi.string().min(2).max(200),
    description: Joi.string().max(2000),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    due_date: Joi.date().iso(),
    estimated_hours: Joi.number().integer().min(0),
    actual_hours: Joi.number().integer().min(0),
    status_id: Joi.string().uuid()
  }),

  // Task status schemas
  createTaskStatus: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#6B7280'),
    position: Joi.number().integer().min(0).default(0)
  }),

  updateTaskStatus: Joi.object({
    name: Joi.string().min(2).max(50),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    position: Joi.number().integer().min(0)
  }),

  // Notification schemas
  markNotificationRead: Joi.object({
    is_read: Joi.boolean().required()
  })
};

module.exports = {
  validate,
  schemas
};
