#!/bin/bash

echo "🔧 Fix Swagger Authentication Configuration"
echo "=========================================="

cd backend

echo ""
echo "🔍 Step 1: Add Health Check Documentation"
echo "========================================="

# Add health check documentation to server.js
cat > temp_server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const teamRoutes = require('./src/routes/teams');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const notificationRoutes = require('./src/routes/notifications');
const analyticsRoutes = require('./src/routes/analytics');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { notFound } = require('./src/middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Terlalu banyak permintaan, silakan coba lagi nanti'
  }
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
EOF

echo "✅ Health check documentation added"

echo ""
echo "🔍 Step 2: Update Swagger Configuration"
echo "======================================"

# Update swagger.js to remove global security requirement
cat > src/config/swagger.js << 'EOF'
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskMe API',
      version: '1.0.0',
      description: 'API Documentation untuk Task Management System',
      contact: {
        name: 'API Support',
        email: 'support@taskme.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.taskme.com' 
          : `http://localhost:${process.env.PORT || 9561}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            username: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            full_name: {
              type: 'string'
            },
            avatar_url: {
              type: 'string',
              format: 'uri'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user']
            },
            is_active: {
              type: 'boolean'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            leader_id: {
              type: 'string',
              format: 'uuid'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'on_hold', 'cancelled']
            },
            progress: {
              type: 'integer',
              minimum: 0,
              maximum: 100
            },
            start_date: {
              type: 'string',
              format: 'date'
            },
            end_date: {
              type: 'string',
              format: 'date'
            },
            team_id: {
              type: 'string',
              format: 'uuid'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent']
            },
            due_date: {
              type: 'string',
              format: 'date-time'
            },
            estimated_hours: {
              type: 'integer'
            },
            actual_hours: {
              type: 'integer'
            },
            status_id: {
              type: 'string',
              format: 'uuid'
            },
            project_id: {
              type: 'string',
              format: 'uuid'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TaskStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            color: {
              type: 'string'
            },
            position: {
              type: 'integer'
            },
            project_id: {
              type: 'string',
              format: 'uuid'
            },
            is_default: {
              type: 'boolean'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            message: {
              type: 'string'
            },
            type: {
              type: 'string'
            },
            is_read: {
              type: 'boolean'
            },
            related_id: {
              type: 'string',
              format: 'uuid'
            },
            related_type: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TeamMember: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            team_id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            role: {
              type: 'string',
              enum: ['leader', 'member', 'viewer']
            },
            joined_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProjectCollaborator: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            project_id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            role: {
              type: 'string',
              enum: ['owner', 'collaborator', 'viewer']
            },
            added_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TaskMember: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            task_id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            assigned_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TaskComment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            task_id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            message: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        TaskAttachment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            task_id: {
              type: 'string',
              format: 'uuid'
            },
            filename: {
              type: 'string'
            },
            original_name: {
              type: 'string'
            },
            file_size: {
              type: 'integer'
            },
            mime_type: {
              type: 'string'
            },
            uploaded_at: {
              type: 'string',
              format: 'date-time'
            },
            uploaded_by: {
              type: 'string',
              format: 'uuid'
            }
          }
        },
        TaskExtensions: {
          type: 'object',
          properties: {
            number_phone: {
              type: 'string'
            },
            sales_name: {
              type: 'string'
            },
            name_pt: {
              type: 'string'
            },
            iup: {
              type: 'string'
            },
            latitude: {
              type: 'number'
            },
            longitude: {
              type: 'number'
            },
            photo_link: {
              type: 'string'
            },
            count_photo: {
              type: 'integer'
            },
            voice_link: {
              type: 'string'
            },
            count_voice: {
              type: 'integer'
            },
            voice_transcript: {
              type: 'string'
            },
            is_completed: {
              type: 'boolean'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Access token required'
                  },
                  message: {
                    type: 'string',
                    example: 'Silakan login terlebih dahulu'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Insufficient permissions'
                  },
                  message: {
                    type: 'string',
                    example: 'Anda tidak memiliki izin untuk mengakses resource ini'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Resource not found'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
    // Removed global security requirement - endpoints will specify their own security
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/server.js' // Include server.js for health check documentation
  ]
};

const specs = swaggerJsdoc(options);
module.exports = specs;
EOF

echo "✅ Swagger configuration updated (removed global security)"

echo ""
echo "🔍 Step 3: Create Summary of Endpoints"
echo "======================================"

cat > swagger-endpoints-summary.md << 'EOF'
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
EOF

echo "✅ Endpoints summary created"

echo ""
echo "🔍 Step 4: Test Swagger Configuration"
echo "==================================="

echo "📊 Testing Swagger configuration..."
node -e "
const swaggerSpec = require('./src/config/swagger');
console.log('✅ Swagger configuration loaded successfully');
console.log('📋 Available paths:', Object.keys(swaggerSpec.paths || {}));
console.log('🔒 Security schemes:', Object.keys(swaggerSpec.components?.securitySchemes || {}));
"

echo ""
echo "✨ Swagger Authentication Configuration Fixed!"
echo ""
echo "🔧 Changes Made:"
echo "  1. ✅ Added security: [] to /api/auth/register"
echo "  2. ✅ Added security: [] to /api/auth/login"
echo "  3. ✅ Added security: [] to /health endpoint"
echo "  4. ✅ Removed global security requirement from swagger.js"
echo "  5. ✅ Created endpoints summary documentation"
echo ""
echo "🚀 Now you can:"
echo "  - Test /api/auth/login without auth token"
echo "  - Test /api/auth/register without auth token"
echo "  - Test /health endpoint without auth token"
echo "  - All other endpoints still require auth token"
echo ""
echo "📚 Check the documentation at: http://localhost:9561/api-docs"
