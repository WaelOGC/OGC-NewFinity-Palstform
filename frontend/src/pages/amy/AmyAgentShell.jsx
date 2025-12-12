import React, { useEffect, useState, useRef } from 'react';
import {
  amyListSessions,
  amyGetSession,
  amyCreateSession,
  amySendMessage,
} from '../../utils/apiClient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './amy-shell.css';

export default function AmyAgentShell() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      try {
        setLoadingSessions(true);
        const data = await amyListSessions();
        if (!isMounted) return;
        setSessions(data);
        if (data.length > 0) {
          setActiveSessionId(data[0].id);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load sessions');
      } finally {
        if (isMounted) setLoadingSessions(false);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load messages for active session
  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      try {
        setLoadingChat(true);
        const session = await amyGetSession(activeSessionId);
        if (!isMounted) return;
        setMessages(session.messages || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load session');
      } finally {
        if (isMounted) setLoadingChat(false);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  async function handleNewSession(presetTitle) {
    try {
      setError(null);
      const session = await amyCreateSession(presetTitle);
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (err) {
      setError(err.message || 'Failed to create session');
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !activeSessionId) return;

    try {
      setError(null);
      setLoadingChat(true);
      const result = await amySendMessage(activeSessionId, trimmed);

      setMessages((prev) => [
        ...prev,
        result.userMessage,
        result.assistantMessage,
      ]);
      setInput('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoadingChat(false);
    }
  }

  const displayName = user?.displayName || user?.name || 'OGC Member';
  const userInitials =
    displayName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'OU';

  return (
    <div className="amy-shell-root" data-theme={theme}>
      {/* Top bar independent from dashboard */}
      <header className="amy-shell-header">
        <div className="amy-shell-brand" onClick={() => navigate('/dashboard/overview')}>
          <span className="brand-main">OGC NewFinity</span>
          <span className="brand-divider">/</span>
          <span className="brand-amy">Amy Agent (preview)</span>
        </div>
        <div className="amy-shell-header-actions">
          <button
            type="button"
            className="amy-header-btn"
            onClick={toggleTheme}
          >
            {isDark ? 'Dark' : 'Light'}
          </button>
          <button
            type="button"
            className="amy-header-btn amy-header-btn--outline"
            onClick={() => navigate('/dashboard/overview')}
          >
            Back to dashboard
          </button>
          <div className="amy-shell-avatar" title={displayName}>
            {userInitials}
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="amy-shell-layout">
        {/* Left: sessions */}
        <aside className="amy-shell-sidebar">
          <div className="amy-sidebar-section">
            <button
              type="button"
              className="amy-new-session-btn"
              onClick={() => handleNewSession('New Amy session')}
            >
              + New session
            </button>
          </div>

          <div className="amy-sidebar-section amy-sidebar-presets">
            <p className="section-title">Presets</p>
            <button
              type="button"
              className="amy-preset-btn"
              onClick={() => handleNewSession('Write & summarize')}
            >
              ✏️ Write & summarize
            </button>
            <button
              type="button"
              className="amy-preset-btn"
              onClick={() => handleNewSession('Code helper')}
            >
              💻 Code helper
            </button>
            <button
              type="button"
              className="amy-preset-btn"
              onClick={() => handleNewSession('Design prompts')}
            >
              🎨 Design prompts
            </button>
          </div>

          <div className="amy-sidebar-section amy-sidebar-sessions">
            <p className="section-title">
              Sessions {loadingSessions && <span className="chip">Loading…</span>}
            </p>
            <div className="amy-session-list">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={
                    'amy-session-item' +
                    (s.id === activeSessionId ? ' amy-session-item--active' : '')
                  }
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <span className="title">{s.title}</span>
                  <span className="preview">{s.preview}</span>
                </button>
              ))}
              {sessions.length === 0 && !loadingSessions && (
                <p className="amy-empty-text">
                  No sessions yet. Start with a preset or create a new one.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Center: chat */}
        <main className="amy-shell-chat">
          {error && (
            <div className="amy-alert amy-alert--warning">
              {error}
            </div>
          )}

          {!activeSessionId && !loadingSessions && (
            <div className="amy-empty-chat">
              <h2>Welcome, {displayName}</h2>
              <p>
                This is the Amy Agent preview. Choose a preset on the left or create a new session
                to start experimenting with the workflow.
              </p>
            </div>
          )}

          {activeSessionId && (
            <>
              <div className="amy-chat-messages">
                {loadingChat && messages.length === 0 && (
                  <p className="amy-muted">Loading conversation…</p>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      'amy-message amy-message--' + (m.role === 'user' ? 'user' : 'assistant')
                    }
                  >
                    <div className="avatar">
                      {m.role === 'user' ? userInitials : 'A'}
                    </div>
                    <div className="bubble">
                      <div className="role">
                        {m.role === 'user' ? 'You' : 'Amy (mock)'}
                      </div>
                      <div className="content">{m.content}</div>
                    </div>
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>

              <form className="amy-chat-input-row" onSubmit={handleSend}>
                <textarea
                  className="amy-chat-input"
                  placeholder="Ask Amy to draft, code, or plan something for your OGC projects…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                />
                <button
                  type="submit"
                  className="amy-send-btn"
                  disabled={!input.trim() || loadingChat}
                >
                  {loadingChat ? 'Sending…' : 'Send'}
                </button>
              </form>

              <p className="amy-disclaimer">
                Amy Agent is in preview. Responses are mock and will be connected to real AI tools
                and your OGC workspace in later phases.
              </p>
            </>
          )}
        </main>

        {/* Right: tools / context */}
        <aside className="amy-shell-sidepanel">
          <div className="amy-side-card">
            <h3>Amy tool roadmap</h3>
            <ul>
              <li>Phase 1 — Core tools: Writer, Code helper, Design prompt generator.</li>
              <li>Phase 2 — Automation: Auto-research, document generation, workflows.</li>
              <li>Phase 3 — Strategy: Business planning, product blueprints, UX drafts.</li>
            </ul>
          </div>

          <div className="amy-side-card">
            <h3>Workspace context</h3>
            <p>
              In future phases, this panel will connect to your projects (wallet, challenge,
              ecosystem docs) to give Amy live context about OGC NewFinity.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
