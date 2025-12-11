import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./AuthForm.css";
import "./TwoFactorChallenge.css";

function LoginForm() {
  const navigate = useNavigate();
  const { login, verifyTwoFactor, loading, isAuthenticated, user, logout, resendActivation } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  
  // Phase 3: 2FA challenge state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="auth-form-authenticated">
        <div className="auth-form-authenticated-title">Signed in</div>
        <div className="auth-form-authenticated-info">Email: {user?.email}</div>
        {user?.fullName && (
          <div className="auth-form-authenticated-info">Name: {user.fullName}</div>
        )}
        <button
          type="button"
          className="auth-form-logout-btn"
          onClick={logout}
        >
          Log out
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    setShowResend(false);

    try {
      const result = await login(email, password);
      
      // Phase 3: Check if 2FA is required
      if (result && result.twoFactorRequired) {
        setTwoFactorRequired(true);
        setChallengeToken(result.challengeToken);
        return;
      }
      
      setStatus({ type: "success", message: "Login successful" });
    } catch (err) {
      console.error("Login error:", err);
      const isNotVerified = err.code === 'ACCOUNT_NOT_VERIFIED' || err.backendCode === 'ACCOUNT_NOT_VERIFIED';
      // Use backendMessage if available, otherwise fall back to message
      const errorMessage = err.backendMessage || err.message || "Login failed";
      setStatus({
        type: "error",
        message: errorMessage,
        code: err.backendCode || err.code,
      });
      if (isNotVerified) {
        setShowResend(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTwoFactorVerify(e) {
    e.preventDefault();
    if (!twoFactorCode || !/^\d{6}$/.test(twoFactorCode)) {
      setStatus({ type: "error", message: "Please enter a valid 6-digit code" });
      return;
    }

    setVerifying(true);
    setStatus(null);

    try {
      await verifyTwoFactor(challengeToken, twoFactorCode);
      setStatus({ type: "success", message: "Login successful" });
      setTwoFactorRequired(false);
      setChallengeToken(null);
      setTwoFactorCode("");
    } catch (err) {
      console.error("2FA verification error:", err);
      const errorMessage = err.backendMessage || err.message || "Invalid code. Please try again.";
      setStatus({
        type: "error",
        message: errorMessage,
        code: err.backendCode || err.code,
      });
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendActivation() {
    if (!email) {
      setStatus({ type: "error", message: "Please enter your email address first" });
      return;
    }

    setResending(true);
    setStatus(null);
    try {
      await resendActivation(email);
      setStatus({ 
        type: "success", 
        message: "If an account exists for this email, a new activation link has been sent." 
      });
      setShowResend(false);
    } catch (err) {
      // Use backendMessage if available, otherwise fall back to message
      const errorMessage = err.backendMessage || err.message || "Failed to resend activation email";
      setStatus({ type: "error", message: errorMessage });
    } finally {
      setResending(false);
    }
  }

  // Phase 3: Show 2FA challenge screen if required
  if (twoFactorRequired) {
    return (
      <div className="auth-form">
        <div className="auth-form-title">Two-Factor Authentication</div>
        <p style={{ opacity: 0.8, marginBottom: "24px", textAlign: "center" }}>
          Enter the 6-digit code from your authenticator app
        </p>
        
        <form onSubmit={handleTwoFactorVerify} className="auth-form">
          <div className="auth-form-field">
            <label htmlFor="two-factor-code" className="auth-form-label">
              6-Digit Code
            </label>
            <input
              id="two-factor-code"
              type="text"
              className="auth-form-input"
              value={twoFactorCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFactorCode(value);
              }}
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
              style={{ textAlign: "center", fontSize: "1.5em", letterSpacing: "0.3em", fontFamily: "monospace" }}
            />
          </div>

          <button
            type="submit"
            disabled={verifying || twoFactorCode.length !== 6}
            className="auth-form-submit-btn"
          >
            {verifying ? "Verifying..." : "Verify & Sign In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setTwoFactorRequired(false);
              setChallengeToken(null);
              setTwoFactorCode("");
              setStatus(null);
            }}
            className="auth-form-link"
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '12px'
            }}
          >
            ← Back to login
          </button>

          {status && (
            <div
              className={`auth-form-status auth-form-status--${status.type}`}
              role="alert"
              aria-live="polite"
            >
              {status.message}
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-form-title">Sign in to OGC</div>

      <div className="auth-form-field">
        <label htmlFor="login-email" className="auth-form-label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          className="auth-form-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <div className="auth-form-field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label htmlFor="login-password" className="auth-form-label" style={{ marginBottom: 0 }}>
            Password
          </label>
          <button
            type="button"
            onClick={() => navigate('/auth/forgot-password')}
            className="auth-form-link"
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            Forgot password?
          </button>
        </div>
        <input
          id="login-password"
          type="password"
          className="auth-form-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || loading}
        className="auth-form-submit-btn"
        aria-label="Sign in to OGC NewFinity"
      >
        {submitting || loading ? "Signing in..." : "Sign in to OGC"}
      </button>

      {status && (
        <div
          className={`auth-form-status auth-form-status--${status.type}`}
          role="alert"
          aria-live="polite"
        >
          {status.message}
          {showResend && status.type === "error" && (
            <div className="auth-form-resend">
              <p className="auth-form-resend-text">
                Your account is not activated yet. Check your email for the activation link, or request a new one.
              </p>
              <button
                type="button"
                onClick={handleResendActivation}
                disabled={resending}
                className="auth-form-resend-btn"
              >
                {resending ? "Sending..." : "Resend activation email"}
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

export default LoginForm;
