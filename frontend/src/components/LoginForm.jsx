import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./AuthForm.css";

function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated, user, logout, resendActivation } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);

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
      await login(email, password);
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
