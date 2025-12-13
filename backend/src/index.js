// Load and validate environment variables FIRST before any other imports
import env from './config/env.js';
import { createRequire } from 'module';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { errorHandler } from './middleware/error.js';
import { requestId } from './middleware/requestId.js';
import routes from './routes/index.js';
import { initEmailService } from './services/emailService.js';
import { ensureDefaultAdmin } from './utils/ensureDefaultAdmin.js';
import { ensurePhase5Migration } from './utils/ensurePhase5Migration.js';
import { resolveUserSchema } from './utils/userSchemaResolver.js';
import { checkPermissionRegistry } from './utils/permissionRegistryCheck.js';
import pool from './db.js';

// Import Passport providers configuration (registers all OAuth strategies)
import './config/passportProviders.js';

const app = express();

// Core middleware
app.use(helmet());

// CORS configuration - explicitly allow frontend origin with credentials
// CRITICAL: credentials: true is required for cookies to work
const corsOptions = {
  origin: env.CORS_ORIGIN 
    ? (Array.isArray(env.CORS_ORIGIN) ? env.CORS_ORIGIN : [env.CORS_ORIGIN])
    : env.NODE_ENV === 'production'
      ? false // In production, CORS_ORIGIN must be set
      : [
          env.FRONTEND_BASE_URL, 
          'http://localhost:3000', 
          'http://127.0.0.1:5173',
          'http://localhost:5173',
          'http://127.0.0.1:3000'
        ], // Dev defaults
  credentials: true, // REQUIRED for cookies to be sent/received
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'], // Allow frontend to see Set-Cookie headers
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(requestId); // Request ID middleware (must be early for observability)
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(passport.initialize()); // Initialize Passport (we don't use passport.session())

// Auth route logging middleware (before routes)
app.use('/api/v1/auth', (req, res, next) => {
  const startTime = Date.now();
  console.log(`[AUTH REQUEST] ${req.method} ${req.originalUrl}`);
  
  // Log response status when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[AUTH RESPONSE] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

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

const PORT = env.PORT;
const HOST = env.HOST;

// Initialize email service and start server
(async () => {
  try {
    // Initialize email service (prints its own startup summary)
    initEmailService();
    
    // Dev-only: Ensure Phase 5 migration is applied (runs only in non-production)
    await ensurePhase5Migration();
    
    // Dev-only: Ensure default admin user exists (runs only in non-production)
    await ensureDefaultAdmin();
    
    // Initialize user schema resolver (safe to fail - will use defaults)
    try {
      await resolveUserSchema();
      console.log('[Backend] User schema resolver initialized');
    } catch (err) {
      console.warn('[Backend] Failed to initialize user schema resolver:', err.message);
      console.warn('[Backend] Continuing with default schema (graceful degradation)');
    }
    
    // Run permission registry parity check (development only)
    checkPermissionRegistry();
    
    app.listen(PORT, HOST, () => {
      const baseUrl = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
      
      // OAuth configuration verification
      const require = createRequire(import.meta.url);
      const {
        getBackendBaseUrl,
        getFrontendBaseUrl,
        getOAuthCallbackUrl,
        OAUTH_PROVIDERS
      } = require('./utils/oauthConfig.cjs');
      const backendBaseUrl = getBackendBaseUrl();
      const frontendBaseUrl = getFrontendBaseUrl();
      
      // Comprehensive startup logs - impossible to ignore
      console.log('\n' + '='.repeat(60));
      console.log('[Backend] ✅ Server Started Successfully');
      console.log('='.repeat(60));
      console.log(`[Backend] Listening on http://${HOST}:${PORT}`);
      console.log(`[Backend] Environment: ${env.NODE_ENV}`);
      console.log(`[Backend] Base URL: ${baseUrl}`);
      console.log(`[Backend] Frontend URL: ${frontendBaseUrl}`);
      
      // OAuth Configuration
      console.log('\n[OAuth Config] OAuth Configuration:');
      console.log(`[OAuth Config] Backend URL: ${backendBaseUrl}`);
      console.log(`[OAuth Config] Frontend URL: ${frontendBaseUrl}`);
      if (!env.FRONTEND_BASE_URL) {
        console.warn('[OAuth Config] WARNING: FRONTEND_BASE_URL is missing. OAuth redirects will be wrong.');
      }
      console.log('[OAuth Config] Callback URLs:');
      OAUTH_PROVIDERS.forEach(provider => {
        console.log(`[OAuth Config]   ${provider}: ${getOAuthCallbackUrl(provider)}`);
      });
      
      console.log(`\n[Backend] Cookie Secure: ${env.COOKIE_SECURE}`);
      console.log(`[Backend] Cookie SameSite: ${env.COOKIE_SAMESITE}`);
      console.log(`[Backend] Health: ${baseUrl}/api/v1/health`);
      console.log(`[Backend] Status: ${baseUrl}/status`);
      console.log('='.repeat(60) + '\n');
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error('\n' + '='.repeat(60));
        console.error(`[Backend] ❌ Port ${PORT} is already in use.`);
        console.error('[Backend] Run: npm run dev:clean');
        console.error('='.repeat(60) + '\n');
        process.exit(1);
      } else {
        console.error('[Backend] Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
})();

