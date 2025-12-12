/**
 * Challenge Program Controller (PHASE D2)
 * Handles challenge overview, tracks, and timeline endpoints
 */

import * as challengeService from '../services/challengeService.js';
import { sendOk, sendError } from '../utils/apiResponse.js';

/**
 * Get challenge overview for the authenticated user
 * GET /api/v1/challenge/overview
 */
async function getChallengeOverview(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const overview = await challengeService.getChallengeOverviewForUser(userId);

    return sendOk(res, overview);
  } catch (err) {
    next(err);
  }
}

/**
 * Get all challenge tracks
 * GET /api/v1/challenge/tracks
 */
async function getChallengeTracks(req, res, next) {
  try {
    const tracks = await challengeService.getChallengeTracks();
    return sendOk(res, tracks);
  } catch (err) {
    next(err);
  }
}

/**
 * Get challenge program timeline
 * GET /api/v1/challenge/timeline
 */
async function getChallengeTimeline(req, res, next) {
  try {
    const timeline = await challengeService.getChallengeTimeline();
    return sendOk(res, timeline);
  } catch (err) {
    next(err);
  }
}

export {
  getChallengeOverview,
  getChallengeTracks,
  getChallengeTimeline,
};
