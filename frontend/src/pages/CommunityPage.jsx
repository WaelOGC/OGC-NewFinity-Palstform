/**
 * Community Page - Community interaction hub
 * 
 * Displays community posts/comments and allows users to submit new comments.
 * Currently uses local state - backend integration TODO.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

export default function CommunityPage() {
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('landing-page-theme');
    return savedTheme || 'dark';
  });

  // Mock community posts - TODO: Replace with API call
  const [posts, setPosts] = useState([
    {
      id: 1,
      username: 'BlockchainBuilder',
      timestamp: '2026-01-15 14:30',
      comment: 'Excited to see the OGC NewFinity platform launch! The AI + Blockchain combination is exactly what we need.',
      reactions: { like: 12, heart: 5, fire: 8, handshake: 3, thinking: 1 }
    },
    {
      id: 2,
      username: 'AIDeveloper',
      timestamp: '2026-01-14 10:15',
      comment: 'The Challenge Program looks amazing. Can\'t wait to participate in the Freelancer track!',
      reactions: { like: 8, heart: 4, fire: 6, handshake: 2, thinking: 0 }
    },
    {
      id: 3,
      username: 'CryptoEnthusiast',
      timestamp: '2026-01-13 18:45',
      comment: 'The tokenomics are well thought out. Genesis Token on Polygon is a smart move for accessibility.',
      reactions: { like: 15, heart: 7, fire: 10, handshake: 4, thinking: 2 }
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const comment = {
        id: posts.length + 1,
        username: 'You', // TODO: Get from auth context
        timestamp: new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        comment: newComment.trim(),
        reactions: { like: 0, heart: 0, fire: 0, handshake: 0, thinking: 0 }
      };

      setPosts(prev => [comment, ...prev]);
      setNewComment('');
      setSubmitting(false);
    }, 500);
  };

  const handleReaction = (postId, reactionType) => {
    // TODO: Implement backend API call
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reactionType]: post.reactions[reactionType] + 1
          }
        };
      }
      return post;
    }));
  };

  return (
    <main className={`landing-root ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <div className="lp-bg-layer">
        <div className="fog fog-1"></div>
        <div className="fog fog-2"></div>
        <div className="fog fog-3"></div>
        <div className="neural-lines"></div>
      </div>

      <div className="landing-container">
        <div style={{ paddingTop: '80px' }}>
          <Link to="/" className="btn-transparent" style={{ marginBottom: '32px', display: 'inline-block' }}>
            ← Back to Home
          </Link>

          <section className="lp-section content-section">
            <div className="glass-card">
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px' }}>
                Join the OGC Community
              </h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '40px', opacity: 0.9 }}>
                Connect with builders, developers, and innovators shaping the future of AI and blockchain.
                Share your thoughts, ask questions, and engage with the community.
              </p>

              {/* Comment Input */}
              <div className="glass-card" style={{ marginBottom: '40px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Share Your Thoughts
                </h3>
                <form onSubmit={handleSubmitComment}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      marginBottom: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--brand-color-2)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 198, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-subtle)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting || !newComment.trim()}
                    style={{ opacity: submitting || !newComment.trim() ? 0.6 : 1 }}
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>

              {/* Community Posts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="glass-card"
                    style={{
                      padding: '24px',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ color: 'var(--brand-color-2)', fontSize: '1rem' }}>
                          {post.username}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '12px' }}>
                          {post.timestamp}
                        </span>
                      </div>
                    </div>
                    <p style={{ 
                      margin: '0 0 16px', 
                      color: 'var(--text-primary)', 
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}>
                      {post.comment}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      flexWrap: 'wrap',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <button
                        onClick={() => handleReaction(post.id, 'like')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(0, 255, 198, 0.1)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        👍 <span style={{ fontSize: '0.85rem' }}>{post.reactions.like}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(post.id, 'heart')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 60, 172, 0.1)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        ❤️ <span style={{ fontSize: '0.85rem' }}>{post.reactions.heart}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(post.id, 'fire')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 188, 37, 0.1)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        🔥 <span style={{ fontSize: '0.85rem' }}>{post.reactions.fire}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(post.id, 'handshake')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(88, 100, 255, 0.1)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        🤝 <span style={{ fontSize: '0.85rem' }}>{post.reactions.handshake}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(post.id, 'thinking')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(0, 255, 198, 0.1)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        🤔 <span style={{ fontSize: '0.85rem' }}>{post.reactions.thinking}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

