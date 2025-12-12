// backend/src/controllers/amyAgent.controller.js

import * as amyService from '../services/amyAgentService.js';

async function listSessions(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const sessions = await amyService.listSessionsForUser(userId);

    return res.status(200).json({
      status: 'OK',
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { sessionId } = req.params;
    const session = await amyService.getSessionById(userId, sessionId);

    return res.status(200).json({
      status: 'OK',
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

async function createSession(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { title } = req.body || {};
    const session = await amyService.createSession(userId, title);

    return res.status(201).json({
      status: 'OK',
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { sessionId } = req.params;
    const { content } = req.body || {};

    if (!content) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Message content is required',
      });
    }

    const result = await amyService.sendMessage(userId, sessionId, content);

    return res.status(200).json({
      status: 'OK',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export {
  listSessions,
  getSession,
  createSession,
  sendMessage,
};
