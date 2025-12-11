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
app.use('/api', (req, res, next) => {
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

app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    checks: {
      backend: 'up'
      // Leave TODO comments for DB or other services if they are not wired yet
      // e.g. db: 'unknown'
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };

  res.json(health);
});

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : 'localhost');

// Initialize email service and start server
(async () => {
  try {
    await initEmailService();
    
    // Dev-only: Ensure default admin user exists (runs only in non-production)
    await ensureDefaultAdmin();
    
    app.listen(PORT, HOST, () => {
      console.log(`OGC NewFinity backend listening on ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize email service:', error.message);
    console.error('Server startup aborted. Please configure SMTP settings in .env file.');
    process.exit(1);
  }
})();

