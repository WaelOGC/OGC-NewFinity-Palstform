/**
 * Contact Page - Contact form page
 * 
 * Simple contact form with validation.
 * Currently logs to console - backend integration TODO.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

export default function ContactPage() {
  const [theme] = useState(() => {
    const savedTheme = localStorage.getItem('landing-page-theme');
    return savedTheme || 'dark';
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // TODO: Implement backend API call
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitted(false);
      }, 3000);
    }
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
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px', textAlign: 'center' }}>
                Contact Us
              </h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '40px', textAlign: 'center', opacity: 0.9 }}>
                Have questions or feedback? We'd love to hear from you.
              </p>

              {submitted ? (
                <div style={{
                  padding: '24px',
                  background: 'rgba(0, 255, 198, 0.1)',
                  border: '1px solid var(--brand-color-2)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: 'var(--brand-color-2)', fontWeight: 500 }}>
                    Thank you! Your message has been sent. We'll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      Name <span style={{ color: 'var(--brand-color-4)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--card-bg)',
                        border: `1px solid ${errors.name ? 'var(--brand-color-4)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--brand-color-2)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 198, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.name ? 'var(--brand-color-4)' : 'var(--border-subtle)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.name && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--brand-color-4)' }}>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      Email <span style={{ color: 'var(--brand-color-4)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--card-bg)',
                        border: `1px solid ${errors.email ? 'var(--brand-color-4)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--brand-color-2)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 198, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email ? 'var(--brand-color-4)' : 'var(--border-subtle)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.email && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--brand-color-4)' }}>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="subject" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      Subject (Optional)
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
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
                  </div>

                  <div>
                    <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      Message <span style={{ color: 'var(--brand-color-4)' }}>*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'var(--card-bg)',
                        border: `1px solid ${errors.message ? 'var(--brand-color-4)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--brand-color-2)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 198, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.message ? 'var(--brand-color-4)' : 'var(--border-subtle)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    {errors.message && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--brand-color-4)' }}>
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

