import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { testDatabaseConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Security & Utility Middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl || '*',
  credentials: true,
}));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/v1/health', async (req, res) => {
  const dbStatus = await testDatabaseConnection();
  res.status(200).json({
    success: true,
    application: 'College Management Portal API',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Mount Central API Router (supporting both /api/v1 prefix and root paths)
app.use('/api/v1', apiRouter);
app.use(apiRouter);

// API Root Information
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the College Management Portal (CMP) REST API v1',
    documentation: '/docs/TECHNICAL_MASTER_PLAN.md',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      departments: '/api/v1/departments',
      faculty: '/api/v1/faculty',
      students: '/api/v1/students',
      courses: '/api/v1/courses',
      enrollments: '/api/v1/enrollments',
      attendance: '/api/v1/attendance',
      notices: '/api/v1/notices',
      dashboard: '/api/v1/dashboard',
    },
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on endpoint: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, async () => {
  console.log(`====================================================`);
  console.log(` CMP Backend API Server running on port ${config.port}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Health check: http://localhost:${config.port}/api/v1/health`);
  console.log(`====================================================`);
  
  // Verify remote database on startup
  await testDatabaseConnection();
});

export default app;
