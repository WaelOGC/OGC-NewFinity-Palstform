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
        const { api } = await import('../../utils/apiClient.js');
        const data = await api.get(`/auth/activate?token=${encodeURIComponent(token)}`);

        if (data.status === 'OK') {
          setStatus('success');
          setMessage('Your account has been activated successfully!');

          // Auto-login if tokens are provided
          if (data.access) {
            // Store token
            window.localStorage.setItem('ogc_token', data.access);
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          } else {
            // If no auto-login, show option to go to sign in
            setTimeout(() => {
              navigate('/auth', { replace: true });
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'This activation link is invalid or has expired.');
        }
      } catch (error) {
        console.error('Activation error:', error);
        setStatus('error');
        // Use user-friendly error message from apiClient
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
            <p className="activation-page-submessage">Redirecting you to your dashboard...</p>
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

