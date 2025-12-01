import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

const app = express();

// Core middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimiter);

// Routes
app.use('/api/v1', routes);

// Health
app.get('/healthz', (_, res) => res.status(200).json({ ok: true }));

// --- Platform status & health endpoints ---

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ogc-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Health endpoint
app.get('/health', (req, res) => {
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
const HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`OGC NewFinity backend listening on ${HOST}:${PORT}`);
});

