// backend/src/services/amyAgentService.js

// In a real system this would hit the database or an external AI router.
// For now, return static mock data.

async function listSessionsForUser(userId) {
  return [
    {
      id: 'sess-quick-notes',
      title: 'Quick notes & planning',
      createdAt: '2025-12-10T21:15:00Z',
      updatedAt: '2025-12-11T10:05:00Z',
      preview: 'Drafting roadmap tasks for OGC NewFinity…',
    },
    {
      id: 'sess-wallet-spec',
      title: 'Wallet API specification',
      createdAt: '2025-12-09T18:00:00Z',
      updatedAt: '2025-12-10T09:45:00Z',
      preview: 'Phase 8.4 — refining wallet endpoints…',
    },
  ];
}

async function getSessionById(userId, sessionId) {
  // For now just return a minimal mock conversation.
  return {
    id: sessionId,
    title: sessionId === 'sess-wallet-spec'
      ? 'Wallet API specification'
      : 'Quick notes & planning',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Help me outline the Amy Agent phases.',
        createdAt: '2025-12-10T21:15:00Z',
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'Sure. Phase 1: core tools (writer, coder, design prompts). Phase 2: automation. Phase 3: business/strategy tools.',
        createdAt: '2025-12-10T21:16:00Z',
      },
    ],
  };
}

async function createSession(userId, title) {
  return {
    id: 'sess-new-' + Date.now(),
    title: title || 'New Amy session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preview: '',
  };
}

async function sendMessage(userId, sessionId, content) {
  // Mock echo-style response.
  return {
    sessionId,
    userMessage: {
      id: 'u-' + Date.now(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    },
    assistantMessage: {
      id: 'a-' + Date.now(),
      role: 'assistant',
      content:
        "Amy (mock): This is a preview environment. In future phases I'll connect to real AI tools and your OGC workspace.",
      createdAt: new Date().toISOString(),
    },
  };
}

export {
  listSessionsForUser,
  getSessionById,
  createSession,
  sendMessage,
};
