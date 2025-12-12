import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/apiClient.js';
import './styles.css';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string, code?: string }
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email') || '';
    
    // Token is required, but email can be missing (for backward compatibility with old links)
    if (!tokenParam) {
      setStatus({
        type: 'error',
        message: 'This reset link is invalid. Please request a new one.',
        code: 'MISSING_TOKEN',
      });
      setIsTokenValid(false);
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam); // Set initial email (may be empty)
    setIsValidating(true);
    setStatus(null);

    // Validate token with backend
    async function validateToken() {
      try {
        // Try validation with email from URL (or empty string if missing)
        const data = await api.post('/auth/password/reset/validate', {
          email: emailParam || '',
          token: tokenParam,
        });

        // Check response format - handle both data.data and direct data
        const responseData = data.data || data;
        
        if (data.status === 'OK' && responseData?.valid) {
          setIsTokenValid(true);
          setStatus(null);
          
          // If the URL didn't include email, but backend knows it, sync it
          if (responseData.email && !emailParam) {
            setEmail(responseData.email);
          }
        } else {
          setIsTokenValid(false);
          setStatus({
            type: 'error',
            message: responseData?.message || data.message || 'This reset link is invalid or has expired.',
            code: 'RESET_TOKEN_INVALID_OR_EXPIRED',
          });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        const errorCode = error.backendCode || error.code;
        const errorMessage = error.backendMessage || error.message || 'This reset link is invalid or has expired.';

        setIsTokenValid(false);
        setStatus({
          type: 'error',
          message: errorMessage,
          code: errorCode === 'RESET_TOKEN_INVALID_OR_EXPIRED' ? 'RESET_TOKEN_INVALID_OR_EXPIRED' : 'RESET_TOKEN_INVALID_OR_EXPIRED',
        });
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    // Client-side validation
    if (!password || password.length < 8) {
      setStatus({
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: 'error',
        message: 'Passwords do not match.',
      });
      setSubmitting(false);
      return;
    }

    try {
      const data = await api.post('/auth/reset-password', {
        token,
        password,
      });

      // Handle response format (check data.data for nested response)
      const responseData = data.data || data;
      const responseMessage = responseData?.message || data.message;

      if (data.status === 'OK' || data.success) {
        setStatus({
          type: 'success',
          message: responseMessage || 'Your password has been reset successfully. Redirecting to login...',
        });
        // Clear password fields
        setPassword('');
        setConfirmPassword('');
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'An error occurred. Please try again.',
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorCode = error.backendCode || error.code;
      const errorMessage = error.backendMessage || error.message || 'An error occurred. Please try again.';

      if (errorCode === 'RESET_TOKEN_INVALID_OR_EXPIRED' || errorCode === 'RESET_TOKEN_INVALID') {
        setStatus({
          type: 'error',
          message: 'This reset link is invalid or has expired.',
          code: 'RESET_TOKEN_INVALID_OR_EXPIRED',
        });
      } else {
        setStatus({
          type: 'error',
          message: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // No token state
  if (!token && status?.code === 'MISSING_TOKEN') {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <div className="reset-password-error-state">
            <div className="reset-password-icon reset-password-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="auth-page-title">Invalid Reset Link</h1>
            <p className="reset-password-message">{status.message}</p>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="auth-form-submit-btn"
              style={{ marginTop: '24px' }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status?.type === 'success') {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <div className="reset-password-success">
            <div className="reset-password-icon reset-password-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="auth-page-title">Password Reset Successful</h1>
            <p className="reset-password-message">Your password has been reset.</p>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="auth-form-submit-btn"
              style={{ marginTop: '24px' }}
            >
              Go to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <div className="reset-password-loading">
            <div className="reset-password-icon">
              <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" strokeLinecap="round">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite" />
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <h1 className="auth-page-title">Validating reset link...</h1>
            <p className="reset-password-message">Please wait while we verify your reset link.</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid/expired token error state
  if (!isTokenValid && status?.type === 'error' && (status.code === 'RESET_TOKEN_INVALID_OR_EXPIRED' || status.code === 'RESET_TOKEN_INVALID')) {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <div className="reset-password-error-state">
            <div className="reset-password-icon reset-password-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="auth-page-title">Reset Link Expired</h1>
            <p className="reset-password-message">{status.message}</p>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/auth/forgot-password')}
                className="auth-form-submit-btn"
              >
                Request a new reset link
              </button>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="auth-form-link"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: '8px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form state (only show if token is valid)
  if (!isTokenValid) {
    return null; // Will be handled by error states above
  }

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-page-header">
          <h1 className="auth-page-title">Set a new password</h1>
          <p className="auth-page-subtitle">
            Enter a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-field">
            <label htmlFor="reset-email" className="auth-form-label">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              className="auth-form-input"
              value={email}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <div className="auth-form-field">
            <label htmlFor="reset-password" className="auth-form-label">
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                disabled={submitting}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="auth-form-hint">At least 8 characters, including one uppercase letter, one lowercase letter, one number, and one symbol.</p>
          </div>

          <div className="auth-form-field">
            <label htmlFor="reset-confirm-password" className="auth-form-label">
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`auth-form-input ${confirmPassword && password !== confirmPassword ? 'auth-form-input--error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-required="true"
                disabled={submitting}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-btn"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="auth-form-error-text">Passwords do not match.</p>
            )}
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
            aria-label="Reset password"
          >
            {submitting ? 'Resetting password...' : 'Reset password'}
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
      </div>
    </div>
  );
}

export default ResetPasswordPage;

