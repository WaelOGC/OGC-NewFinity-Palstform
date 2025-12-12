/**
 * Challenge Program Routes (PHASE D2)
 * Mock API endpoints for challenge overview, tracks, and timeline
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getChallengeOverview,
  getChallengeTracks,
  getChallengeTimeline,
} from '../controllers/challenge.controller.js';

const router = Router();

// All challenge routes require authentication
router.use(requireAuth);

// PHASE D2 — Challenge Program (mock)
router.get('/overview', getChallengeOverview);
router.get('/tracks', getChallengeTracks);
router.get('/timeline', getChallengeTimeline);

// Debug: Log registered routes in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[Challenge Routes] Registered routes:');
  router.stack
    .filter((layer) => layer.route)
    .forEach((layer) => {
      const { path, methods } = layer.route;
      console.log(`  ${Object.keys(methods).join(',').toUpperCase()} ${path}`);
    });
}

export default router;
