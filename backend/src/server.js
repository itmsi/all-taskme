const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
// Force load env from backend/.env regardless of CWD
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('./database/connection');
const { setupSocket } = require('./socket/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const server = createServer(app);
const crypto = require('crypto');

// Parse CORS origins from environment variable (comma-separated)
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:9562")
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting (exclude OPTIONS requests for CORS preflight)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => req.method === 'OPTIONS' || process.env.NODE_ENV === 'development' // Skip rate limiting for CORS preflight requests and in development
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
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

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.io setup
setupSocket(io);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      // Sanitize JWT secret (remove quotes/trim) and reflect back a short hash for debugging
      const rawSecret = process.env.JWT_SECRET || 'dev-super-secret-jwt-key-for-development-only';
      const cleanedSecret = rawSecret.replace(/^['"]|['"]$/g, '').trim();
      // Persist cleaned value for rest of app
      process.env.JWT_SECRET = cleanedSecret;
      const secretHash = cleanedSecret ? crypto.createHash('sha256').update(cleanedSecret).digest('hex').slice(0, 8) : 'none';
      console.log(`[Config] JWT alg=${process.env.JWT_ALGORITHM || 'HS256'}, secretHash=${secretHash}, len=${cleanedSecret.length}`);
      console.log(`[Config] JWT secret=${cleanedSecret}`);
      console.log(`[Config] SSO dblink host=${process.env.DB_GATE_SSO_HOST}:${process.env.DB_GATE_SSO_PORT}, db=${process.env.DB_GATE_SSO_NAME}, user=${process.env.DB_GATE_SSO_USER}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();
