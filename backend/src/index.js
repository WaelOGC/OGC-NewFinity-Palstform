// Load environment variables FIRST before any other imports
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { rateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/error.js';
import routes from './routes/index.js';
import { initEmailService } from './services/emailService.js';
import { ensureDefaultAdmin } from './utils/ensureDefaultAdmin.js';
import { ensurePhase5Migration } from './utils/ensurePhase5Migration.js';
import pool from './db.js';

// Import Passport providers configuration (registers all OAuth strategies)
import './config/passportProviders.js';

const app = express();

// Core middleware
app.use(helmet());

// CORS configuration - explicitly allow frontend origin in development
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : process.env.NODE_ENV === 'production'
      ? false // In production, CORS_ORIGIN must be set
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Dev defaults
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(passport.initialize()); // Initialize Passport (we don't use passport.session())
app.use(rateLimiter);

// Routes
app.use('/api/v1', routes);

// Catch-all for unmatched API routes - return JSON instead of HTML
// IMPORTANT: This must come AFTER /api/v1 routes are mounted
// Express matches routes in order, so /api/v1 will match first
app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'ERROR',
    success: false,
    code: 'NOT_FOUND',
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Platform status & health endpoints ---
// Global health endpoint (before API routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'OGC Backend is running',
  });
});

// Legacy healthz endpoint (for backward compatibility)
app.get('/healthz', (_, res) => res.status(200).json({ ok: true }));

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ogc-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API-prefixed paths for nginx proxy
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ogc-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  const startedAt = Date.now();

  // Default statuses
  let overallStatus = 'ok';
  const checks = {
    backend: 'up',
    db: 'unknown',
    // You can add more services later, e.g.:
    // email: 'unknown',
    // cache: 'unknown',
  };

  // --- Database health check (MySQL) ---
  try {
    // Lightweight query to confirm the DB connection is alive
    const [rows] = await pool.query('SELECT 1 AS ok');
    if (rows && rows.length > 0) {
      checks.db = 'up';
    } else {
      checks.db = 'degraded';
      overallStatus = 'degraded';
    }
  } catch (err) {
    checks.db = 'down';
    overallStatus = 'degraded';
    console.error('[HealthCheck] Database health check failed:', err.message);
  }

  // In the future, you can add more checks here, for example:
  // - Email / SMTP status from the email service
  // - Cache / external services
  // - Queue / job runner health

  const health = {
    status: overallStatus,
    checks,
    version: '1.0.0',
    responseTimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  // If anything critical is degraded, you may want to return 503 instead of 200.
  // For now, use 200 in all cases to avoid breaking existing monitoring.
  res.status(200).json(health);
});

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : 'localhost');

// Initialize email service and start server
(async () => {
  try {
    const emailInit = initEmailService();
    console.log(`[EmailService] Initialized in ${emailInit.mode} mode (from: ${emailInit.from})`);
    
    // Dev-only: Ensure Phase 5 migration is applied (runs only in non-production)
    await ensurePhase5Migration();
    
    // Dev-only: Ensure default admin user exists (runs only in non-production)
    await ensureDefaultAdmin();
    
    app.listen(PORT, HOST, () => {
      console.log(`OGC NewFinity backend listening on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();

