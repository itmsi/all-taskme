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
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);
module.exports = specs;
