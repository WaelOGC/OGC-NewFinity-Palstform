/**
 * Blog Page - Blog index and post views
 * 
 * Displays blog posts with routing to individual post pages.
 * Currently uses static data - backend integration TODO.
 */

import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../styles/landing-page.css';

// Mock blog posts - TODO: Replace with API call
const blogPosts = [
  {
    id: 1,
    slug: 'ogc-newfinity-platform-launch',
    title: 'OGC NewFinity Platform Launch: A New Era of AI and Blockchain',
    excerpt: 'We\'re excited to announce the official launch of the OGC NewFinity platform, combining cutting-edge AI tools with secure blockchain infrastructure.',
    date: '2026-01-15',
    category: 'Announcements',
    content: `
      <p>We're thrilled to announce the official launch of the OGC NewFinity platform, marking a significant milestone in the convergence of artificial intelligence and blockchain technology.</p>
      
      <h2>What Makes OGC NewFinity Unique?</h2>
      <p>The platform brings together four foundational layers that work in harmony:</p>
      <ul>
        <li><strong>Infrastructure Layer:</strong> Robust blockchain infrastructure and AI core systems</li>
        <li><strong>Application Layer:</strong> Powerful AI tools and developer SDKs</li>
        <li><strong>Community Layer:</strong> Global challenge programs and collaborative initiatives</li>
        <li><strong>Economic Layer:</strong> Transparent tokenomics and contribution-based rewards</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>Whether you're a developer, creator, or innovator, OGC NewFinity provides the tools and community support you need to build the future. Join us today and be part of this revolutionary ecosystem.</p>
    `
  },
  {
    id: 2,
    slug: 'challenge-program-2026',
    title: 'Challenge Program 2026: Empowering Global Innovation',
    excerpt: 'The OGC NewFinity Challenge Program is now open for applications across three tracks: School Students, Freelancers, and Startup Teams.',
    date: '2026-01-10',
    category: 'Challenges',
    content: `
      <p>The OGC NewFinity Challenge Program represents our commitment to fostering innovation and supporting builders across the globe.</p>
      
      <h2>Three Tracks, One Mission</h2>
      <p>Our program is designed to be inclusive and accessible:</p>
      <ul>
        <li><strong>School Students (ages 13-18):</strong> Encouraging the next generation of innovators</li>
        <li><strong>Freelancers & Solo Innovators (ages 18+):</strong> Supporting independent creators</li>
        <li><strong>Startup Teams & Groups (ages 18-35):</strong> Empowering collaborative ventures</li>
      </ul>
      
      <h2>What Winners Receive</h2>
      <p>Selected projects receive OGCFinity token grants, expert mentorship, platform access, and ecosystem integration opportunities.</p>
      
      <p>Applications are now open. Don't miss your chance to be part of the future!</p>
    `
  },
  {
    id: 3,
    slug: 'tokenomics-deep-dive',
    title: 'OGCFinity Tokenomics: A Deep Dive',
    excerpt: 'Understanding the two-phase token evolution model: Genesis Token on Polygon and the future Native Token on OGC Chain.',
    date: '2026-01-05',
    category: 'Tokenomics',
    content: `
      <p>The OGCFinity token is the economic backbone of the OGC NewFinity ecosystem, designed with a clear two-phase evolution model.</p>
      
      <h2>Phase 1: Genesis Token</h2>
      <p>The Genesis Token operates on Polygon as a fixed-supply ERC-20 token (500,000,000 OGCFinity). This approach ensures:</p>
      <ul>
        <li>Low transaction costs</li>
        <li>Fast transaction speeds</li>
        <li>Full platform utility from day one</li>
      </ul>
      
      <h2>Phase 2: Native Token</h2>
      <p>The future Native Token will operate on OGC Chain with governance-based supply adjustments. A secure 1:1 migration bridge will enable seamless transition.</p>
      
      <h2>Token Utility</h2>
      <p>OGCFinity tokens unlock premium AI features, reward contributions, fund innovation challenges, and enable governance participation.</p>
    `
  }
];

function BlogIndex() {
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('landing-page-theme');
    return savedTheme || 'dark';
  });

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
                Blog
              </h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '40px', opacity: 0.9 }}>
                Stay updated with the latest news, insights, and updates from the OGC NewFinity platform.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      className="glass-card"
                      style={{
                        padding: '32px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = 'var(--brand-color-2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(0, 255, 198, 0.1)',
                          border: '1px solid var(--brand-color-2)',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          color: 'var(--brand-color-2)',
                          fontWeight: 500
                        }}>
                          {post.category}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          {post.date}
                        </span>
                      </div>
                      <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        margin: '0 0 12px',
                        color: 'var(--text-primary)',
                        lineHeight: 1.3
                      }}>
                        {post.title}
                      </h2>
                      <p style={{
                        margin: 0,
                        color: 'var(--text-primary)',
                        opacity: 0.8,
                        lineHeight: 1.6,
                        fontSize: '1rem'
                      }}>
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function BlogPost() {
  const { slug } = useParams();
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('landing-page-theme');
    return savedTheme || 'dark';
  });

  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <main className={`landing-root ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <div className="lp-bg-layer">
          <div className="fog fog-1"></div>
          <div className="fog fog-2"></div>
          <div className="fog fog-3"></div>
          <div className="neural-lines"></div>
        </div>
        <div className="landing-container">
          <div style={{ paddingTop: '80px', textAlign: 'center' }}>
            <h1>Post Not Found</h1>
            <Link to="/blog" className="btn-transparent">Back to Blog</Link>
          </div>
        </div>
      </main>
    );
  }

  const [reactions, setReactions] = useState({ like: 0, heart: 0, fire: 0, handshake: 0, thinking: 0 });
  const [comments, setComments] = useState([
    {
      id: 1,
      username: 'CommunityMember',
      timestamp: '2026-01-15 16:20',
      comment: 'Great article! Looking forward to more updates.'
    }
  ]);
  const [newComment, setNewComment] = useState('');

  const handleReaction = (type) => {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: comments.length + 1,
      username: 'You',
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      comment: newComment.trim()
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
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
          <Link to="/blog" className="btn-transparent" style={{ marginBottom: '32px', display: 'inline-block' }}>
            ← Back to Blog
          </Link>

          <article className="lp-section content-section">
            <div className="glass-card">
              <div style={{ marginBottom: '24px' }}>
                <span style={{
                  padding: '4px 12px',
                  background: 'rgba(0, 255, 198, 0.1)',
                  border: '1px solid var(--brand-color-2)',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  color: 'var(--brand-color-2)',
                  fontWeight: 500,
                  marginRight: '12px'
                }}>
                  {post.category}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {post.date}
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                marginBottom: '24px',
                color: 'var(--text-primary)',
                lineHeight: 1.2
              }}>
                {post.title}
              </h1>

              <div
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: 'var(--text-primary)',
                  opacity: 0.9
                }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Reaction Bar */}
              <div style={{
                marginTop: '40px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleReaction('like')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--brand-color-2)';
                    e.target.style.background = 'rgba(0, 255, 198, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.background = 'transparent';
                  }}
                >
                  👍 <span>{reactions.like}</span>
                </button>
                <button
                  onClick={() => handleReaction('heart')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--brand-color-4)';
                    e.target.style.background = 'rgba(255, 60, 172, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.background = 'transparent';
                  }}
                >
                  ❤️ <span>{reactions.heart}</span>
                </button>
                <button
                  onClick={() => handleReaction('fire')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--brand-color-3)';
                    e.target.style.background = 'rgba(255, 188, 37, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.background = 'transparent';
                  }}
                >
                  🔥 <span>{reactions.fire}</span>
                </button>
                <button
                  onClick={() => handleReaction('handshake')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--brand-color-1)';
                    e.target.style.background = 'rgba(88, 100, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.background = 'transparent';
                  }}
                >
                  🤝 <span>{reactions.handshake}</span>
                </button>
                <button
                  onClick={() => handleReaction('thinking')}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = 'var(--brand-color-2)';
                    e.target.style.background = 'rgba(0, 255, 198, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                    e.target.style.background = 'transparent';
                  }}
                >
                  🤔 <span>{reactions.thinking}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="glass-card" style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--text-primary)' }}>
                Comments ({comments.length})
              </h2>

              <form onSubmit={handleSubmitComment} style={{ marginBottom: '32px' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
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
                    marginBottom: '16px'
                  }}
                />
                <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
                  Post Comment
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: '20px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--brand-color-2)' }}>{comment.username}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '12px' }}>
                        {comment.timestamp}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

export default function BlogPage() {
  const { slug } = useParams();
  return slug ? <BlogPost /> : <BlogIndex />;
}

