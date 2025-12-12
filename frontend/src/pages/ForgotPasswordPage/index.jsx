import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/apiClient.js';
import './styles.css';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const data = await api.post('/auth/forgot-password', { email });
      
      if (data.status === 'OK' || data.success) {
        setStatus({
          type: 'success',
          message: "If an account exists for this email, a reset link has been sent.",
        });
      } else {
        setStatus({
          type: 'error',
          message: 'Something went wrong. Please try again in a moment.',
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setStatus({
        type: 'error',
        message: 'Something went wrong. Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-page-header">
          <h1 className="auth-page-title">Forgot your password?</h1>
          <p className="auth-page-subtitle">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {status?.type === 'success' ? (
          <div className="forgot-password-success">
            <div className="forgot-password-icon forgot-password-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="forgot-password-success-title">Check your email</h2>
            <p className="forgot-password-message">{status.message}</p>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="auth-form-submit-btn"
              style={{ marginTop: '24px' }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-field">
              <label htmlFor="forgot-email" className="auth-form-label">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                className="auth-form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                disabled={submitting}
              />
            </div>

            {status?.type === 'error' && (
              <div
                className={`auth-form-status auth-form-status--${status.type}`}
                role="alert"
                aria-live="polite"
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="auth-form-submit-btn"
              aria-label="Send reset link"
            >
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="auth-form-link"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

