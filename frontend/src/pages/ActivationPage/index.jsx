import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './styles.css';

function ActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function activateAccount() {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Activation token is missing. Please check your email for the complete activation link.');
        return;
      }

      try {
        // Canonical format: POST /api/v1/auth/activate with JSON body { token }
        // Use fetch directly since apiClient may unwrap the response
        const API_BASE = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_BASE_URL || '/api/v1');
        const response = await fetch(`${API_BASE}/auth/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok || data.status === 'ERROR') {
          setStatus('error');
          setMessage(data.message || 'This activation link is invalid or has expired.');
          return;
        }

        // Success: status === 'OK'
        setStatus('success');
        setMessage(data.message || 'Your account has been activated successfully!');

        // Redirect to login page after a short delay (no auto-login for security)
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      } catch (error) {
        console.error('Activation error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred while activating your account. Please try again later.');
      }
    }

    activateAccount();
  }, [searchParams, navigate]);

  return (
    <div className="activation-page-container">
      <div className="activation-page-card">
        {status === 'loading' && (
          <>
            <div className="activation-page-icon activation-page-icon--loading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="activation-page-title">Activating your account...</h1>
            <p className="activation-page-message">Please wait while we activate your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="activation-page-icon activation-page-icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="activation-page-title">Account Activated!</h1>
            <p className="activation-page-message">{message}</p>
            <p className="activation-page-submessage">Redirecting you to sign in...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="activation-page-icon activation-page-icon--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="activation-page-title">Activation Failed</h1>
            <p className="activation-page-message">{message}</p>
            <div className="activation-page-actions">
              <button
                onClick={() => navigate('/auth')}
                className="activation-page-btn"
              >
                Go to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ActivationPage;

