import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';
import '../AuthPage/styles.css';

const SocialAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const status = searchParams.get('status');
  const provider = searchParams.get('provider') || 'social login';
  const [message, setMessage] = useState('Completing social login...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function finalize() {
      if (status === 'success') {
        setMessage(`Successfully signed in with ${provider}. Redirecting...`);

        try {
          // Verify cookies are set by calling /auth/me
          // The apiClient uses credentials: 'include', so cookies will be sent automatically
          const meData = await api.get('/auth/me');
          
          if (meData.status === 'OK' && meData.user) {
            // Cookies are working, reload the page to refresh AuthContext
            // This ensures AuthContext picks up the cookies and updates user state
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          } else {
            // If /me fails, still try redirect; cookie might be set
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          }
        } catch (err) {
          console.error('[SocialAuthCallback] Failed to fetch user:', err);
          // If /me fails, still try redirect; cookie might be set
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } finally {
          setLoading(false);
        }
      } else {
        setMessage(`Social login with ${provider} failed. Please try again or use email/password.`);
        setLoading(false);
      }
    }

    finalize();
  }, [status, provider]);

  const handleBackToAuth = () => {
    navigate('/auth', { replace: true });
  };

  if (status === 'success') {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <div className="auth-page-header">
            <h1 className="auth-page-title">Sign In Successful</h1>
            <p className="auth-page-subtitle">{message}</p>
            {loading && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,.3)',
                  borderRadius: '50%',
                  borderTopColor: '#fff',
                  animation: 'spin 1s ease-in-out infinite'
                }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-page-header">
          <h1 className="auth-page-title">Sign In Failed</h1>
          <p className="auth-page-subtitle">{message}</p>
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleBackToAuth}
              className="auth-form-submit-btn"
              style={{ 
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthCallback;

