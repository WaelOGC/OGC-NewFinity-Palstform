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

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`OGC NewFinity backend listening on :${PORT}`);
});

