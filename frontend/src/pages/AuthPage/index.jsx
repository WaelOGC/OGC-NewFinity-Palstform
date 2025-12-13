import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import LoginForm from "../../components/LoginForm.jsx";
import RegisterForm from "../../components/RegisterForm.jsx";
import SocialLogin from "../../components/SocialLogin.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/apiClient.js";
import "./styles.css";

function AuthPage() {
  const { isAuthenticated, user, logout, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("signin");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Handle OAuth query parameters
  const oauthStatus = searchParams.get('oauth');
  const oauthProvider = searchParams.get('provider');
  const oauthTicket = searchParams.get('ticket');
  
  // OAuth success handler
  useEffect(() => {
    if (oauthStatus === 'success' && oauthProvider) {
      // Verify cookies are set by calling /auth/me
      // Defensive guard: ensure checkAuth exists before calling
      if (typeof checkAuth === 'function') {
        checkAuth().then(() => {
          // Redirect to dashboard after auth is verified
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
        }).catch(() => {
          // If auth check fails, stay on page
          console.warn('[OAuth] Auth check failed after OAuth success');
        });
      } else {
        console.warn('[OAuth] checkAuth is not available, attempting direct navigation');
        // Fallback: if checkAuth doesn't exist, try navigating anyway
        // The auth context will handle session verification on mount
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      }
    }
  }, [oauthStatus, oauthProvider, checkAuth, navigate]);
  
  // OAuth needs-email state
  const [oauthNeedsEmail, setOauthNeedsEmail] = useState(false);
  const [oauthEmail, setOauthEmail] = useState("");
  const [oauthEmailLoading, setOauthEmailLoading] = useState(false);
  const [oauthEmailError, setOauthEmailError] = useState("");
  
  useEffect(() => {
    if (oauthStatus === 'needs_email' && oauthTicket && oauthProvider) {
      setOauthNeedsEmail(true);
    }
  }, [oauthStatus, oauthTicket, oauthProvider]);
  
  // Handle OAuth email submission
  async function handleOAuthEmailSubmit(e) {
    e.preventDefault();
    
    if (!oauthEmail || !oauthTicket) {
      setOauthEmailError("Email is required");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(oauthEmail)) {
      setOauthEmailError("Please enter a valid email address");
      return;
    }
    
    setOauthEmailLoading(true);
    setOauthEmailError("");
    
    try {
      const response = await api.post('/auth/oauth/complete', {
        ticket: oauthTicket,
        email: oauthEmail.trim(),
      });
      
      if (response.status === 'OK') {
        // Success - verify auth and redirect to dashboard
        // Defensive guard: ensure checkAuth exists before calling
        if (typeof checkAuth === 'function') {
          await checkAuth();
        } else {
          console.warn('[OAuth Complete] checkAuth is not available, proceeding with navigation');
        }
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        setOauthEmailError(response.message || "Failed to complete OAuth authentication");
      }
    } catch (err) {
      console.error('[OAuth Complete] Error:', err);
      const errorMessage = err.backendMessage || err.message || "Failed to complete OAuth authentication";
      const errorCode = err.backendCode || err.code;
      
      // Handle specific error codes
      if (errorCode === 'OAUTH_TICKET_INVALID') {
        setOauthEmailError("This OAuth session has expired. Please try logging in again.");
      } else if (errorCode === 'OAUTH_EMAIL_CONFLICT') {
        setOauthEmailError(errorMessage || "This email is already associated with a different account.");
      } else if (errorCode === 'INVALID_EMAIL') {
        setOauthEmailError("Please enter a valid email address");
      } else {
        setOauthEmailError(errorMessage);
      }
    } finally {
      setOauthEmailLoading(false);
    }
  }

  if (isAuthenticated) {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <h1 className="auth-page-title">Your session</h1>
          <div className="auth-page-authenticated">
            <p className="auth-page-authenticated-text">
              You are currently signed in as <strong>{user?.email}</strong>.
            </p>
            {user?.fullName && (
              <p className="auth-page-authenticated-text">
                Name: <strong>{user.fullName}</strong>
              </p>
            )}
            <button
              type="button"
              className="auth-form-logout-btn"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show OAuth needs-email form if required
  if (oauthNeedsEmail && oauthTicket && oauthProvider) {
    const providerName = oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1);
    
    return (
      <div className="auth-page-container">
        <div className="auth-page-card">
          <div className="auth-page-header">
            <h1 className="auth-page-title">Complete Sign-In</h1>
            <p className="auth-page-subtitle">
              Your {providerName} account didn't share an email address. Please provide your email to complete sign-in.
            </p>
          </div>
          
          <form onSubmit={handleOAuthEmailSubmit} className="auth-form">
            <div className="auth-form-field">
              <label htmlFor="oauth-email" className="auth-form-label">
                Email Address
              </label>
              <input
                id="oauth-email"
                type="email"
                className="auth-form-input"
                value={oauthEmail}
                onChange={(e) => {
                  setOauthEmail(e.target.value);
                  setOauthEmailError("");
                }}
                placeholder="your.email@example.com"
                required
                autoFocus
                disabled={oauthEmailLoading}
              />
              {oauthEmailError && (
                <div className="auth-form-error" style={{ marginTop: '8px', color: '#dc3545' }}>
                  {oauthEmailError}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="auth-form-submit-btn"
              disabled={oauthEmailLoading || !oauthEmail}
            >
              {oauthEmailLoading ? "Completing..." : "Complete Sign-In"}
            </button>
          </form>
          
          <p className="auth-page-footer" style={{ marginTop: '24px' }}>
            By continuing, you agree to link your {providerName} account to this email address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-page-header">
          <h1 className="auth-page-title">Access OGC NewFinity</h1>
          <p className="auth-page-subtitle">
            Sign in or create an account to access dashboards, agent tools, and ecosystem features.
          </p>
        </div>

        <div className="auth-page-tabs">
          <button
            type="button"
            className={`auth-page-tab ${activeTab === "signin" ? "auth-page-tab--active" : ""}`}
            onClick={() => setActiveTab("signin")}
            aria-label="Sign in tab"
            aria-selected={activeTab === "signin"}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`auth-page-tab ${activeTab === "create" ? "auth-page-tab--active" : ""}`}
            onClick={() => setActiveTab("create")}
            aria-label="Create account tab"
            aria-selected={activeTab === "create"}
          >
            Create account
          </button>
        </div>

        <div className="auth-page-content">
          {activeTab === "signin" ? (
            <div className="auth-page-form-wrapper">
              <LoginForm />
              <SocialLogin />
            </div>
          ) : (
            <div className="auth-page-form-wrapper">
              <RegisterForm />
              <SocialLogin />
            </div>
          )}
        </div>

        <p className="auth-page-footer">
          No spam, no noise. Just access to the tools you need.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
