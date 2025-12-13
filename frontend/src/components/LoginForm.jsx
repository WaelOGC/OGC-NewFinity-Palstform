import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { requestPasswordReset } from "../utils/apiClient.js";
import "./AuthForm.css";
import "./TwoFactorChallenge.css";

function LoginForm() {
  const navigate = useNavigate();
  const { login, verifyTwoFactor, loginWithTwoFactorStep, loading, isAuthenticated, user, logout, resendActivation } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  
  // Phase S6: New 2FA state with ticket system
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorTicket, setTwoFactorTicket] = useState(null);
  const [twoFactorMethods, setTwoFactorMethods] = useState({ totp: true, recovery: false });
  const [twoFactorMode, setTwoFactorMode] = useState('totp'); // 'totp' or 'recovery'
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  // Legacy Phase 3: 2FA challenge state (for backward compatibility)
  const [challengeToken, setChallengeToken] = useState(null);

  // Phase 8.3: Password reset panel state
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // Prefill reset email from sign-in email when it changes
  useEffect(() => {
    if (email) {
      setResetEmail(email);
    }
  }, [email]);

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
      
      // Phase S6: Check if 2FA is required (new format)
      if (result && result.status === '2FA_REQUIRED') {
        setTwoFactorRequired(true);
        setTwoFactorTicket(result.ticket);
        setTwoFactorMethods(result.methods || { totp: true, recovery: false });
        setTwoFactorMode('totp'); // Default to TOTP
        setTwoFactorCode("");
        setStatus({ type: "info", message: "Two-factor authentication is required to complete sign-in." });
        return;
      }
      
      // Legacy Phase 3: Check if 2FA is required (old format)
      if (result && result.twoFactorRequired) {
        setTwoFactorRequired(true);
        setChallengeToken(result.challengeToken);
        setTwoFactorMode('totp');
        setTwoFactorCode("");
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
    setVerifying(true);
    setStatus(null);

    try {
      // Phase S6: Use new ticket-based system if available
      if (twoFactorTicket) {
        // Validate code format based on mode
        if (twoFactorMode === 'totp') {
          if (!twoFactorCode || !/^\d{6}$/.test(twoFactorCode)) {
            setStatus({ type: "error", message: "Please enter a valid 6-digit code" });
            setVerifying(false);
            return;
          }
        } else if (twoFactorMode === 'recovery') {
          if (!twoFactorCode || twoFactorCode.trim().length === 0) {
            setStatus({ type: "error", message: "Please enter a recovery code" });
            setVerifying(false);
            return;
          }
        }

        await loginWithTwoFactorStep(twoFactorTicket, twoFactorMode, twoFactorCode);
        setStatus({ type: "success", message: "Login successful" });
        setTwoFactorRequired(false);
        setTwoFactorTicket(null);
        setTwoFactorCode("");
        setTwoFactorMode('totp');
      } else if (challengeToken) {
        // Legacy Phase 3: Use old challenge token system
        if (!twoFactorCode || !/^\d{6}$/.test(twoFactorCode)) {
          setStatus({ type: "error", message: "Please enter a valid 6-digit code" });
          setVerifying(false);
          return;
        }

        await verifyTwoFactor(challengeToken, twoFactorCode);
        setStatus({ type: "success", message: "Login successful" });
        setTwoFactorRequired(false);
        setChallengeToken(null);
        setTwoFactorCode("");
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      const errorCode = err.backendCode || err.code;
      let errorMessage = err.backendMessage || err.message || "Invalid code. Please try again.";
      
      // Handle specific error codes
      if (errorCode === 'INVALID_2FA_TICKET') {
        errorMessage = "Your 2FA session has expired, please sign in again.";
        // Reset to step 1
        setTwoFactorRequired(false);
        setTwoFactorTicket(null);
        setTwoFactorCode("");
      } else if (errorCode === 'INVALID_TOTP_CODE' || errorCode === 'TWO_FACTOR_CODE_INVALID') {
        errorMessage = "The code from your authenticator app is not correct.";
      } else if (errorCode === 'INVALID_RECOVERY_CODE') {
        errorMessage = "This recovery code is invalid or has already been used.";
      } else if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        errorMessage = "Too many verification attempts. Please wait a few minutes and try again.";
      } else if (errorCode === 'VALIDATION_ERROR') {
        errorMessage = err.backendMessage || "Please check your input and try again.";
      }
      
      setStatus({
        type: "error",
        message: errorMessage,
        code: errorCode,
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

  // Phase 8.3: Password reset request handler
  // Uses the same canonical function as /forgot-password page
  async function handlePasswordResetRequest(e) {
    if (e?.preventDefault) e.preventDefault();

    const emailToUse = (resetEmail || email || '').trim();
    if (!emailToUse) {
      setResetMsg('Email is required.');
      return;
    }

    setResetLoading(true);
    setResetMsg('');

    console.log('[AUTH_RESET] sending forgot-password for:', emailToUse);

    try {
      await requestPasswordReset(emailToUse);
      console.log('[AUTH_RESET] request sent OK');
    } catch (err) {
      console.warn('[AUTH_RESET] request failed (suppressed):', err);
      // Suppress error for user-enumeration safety
    } finally {
      setResetLoading(false);
      setResetMsg('If the email exists, a reset link was sent.');
    }
  }

  // Phase S6: Show 2FA challenge screen if required
  if (twoFactorRequired) {
    const canUseRecovery = twoFactorMethods.recovery === true;
    const canUseTotp = twoFactorMethods.totp === true;
    
    return (
      <div className="auth-form">
        <div className="auth-form-title">Two-Factor Authentication</div>
        <p style={{ opacity: 0.8, marginBottom: "24px", textAlign: "center" }}>
          {twoFactorMode === 'totp' 
            ? "Enter the 6-digit code from your authenticator app or a recovery code."
            : "Enter a recovery code to complete sign-in."}
        </p>
        
        {/* Mode toggle - only show if both methods are available */}
        {canUseTotp && canUseRecovery && (
          <div className="twofactor-mode-toggle">
            <button
              type="button"
              className={`twofactor-mode-toggle-btn ${twoFactorMode === 'totp' ? 'twofactor-mode-toggle-btn--active' : ''}`}
              onClick={() => {
                setTwoFactorMode('totp');
                setTwoFactorCode("");
                setStatus(null);
              }}
            >
              Authenticator app
            </button>
            <button
              type="button"
              className={`twofactor-mode-toggle-btn ${twoFactorMode === 'recovery' ? 'twofactor-mode-toggle-btn--active' : ''}`}
              onClick={() => {
                setTwoFactorMode('recovery');
                setTwoFactorCode("");
                setStatus(null);
              }}
            >
              Recovery code
            </button>
          </div>
        )}
        
        <form onSubmit={handleTwoFactorVerify} className="auth-form">
          <div className="auth-form-field">
            <label htmlFor="two-factor-code" className="auth-form-label">
              {twoFactorMode === 'totp' ? '6-Digit Code' : 'Recovery Code'}
            </label>
            <input
              id="two-factor-code"
              type="text"
              className="auth-form-input"
              value={twoFactorCode}
              onChange={(e) => {
                if (twoFactorMode === 'totp') {
                  // Only allow digits, max 6
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTwoFactorCode(value);
                } else {
                  // Allow alphanumeric and dashes for recovery codes
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  setTwoFactorCode(value);
                }
              }}
              placeholder={twoFactorMode === 'totp' ? "000000" : "XXXX-XXXX-XXXX-XXXX"}
              maxLength={twoFactorMode === 'totp' ? 6 : 19}
              required
              autoFocus
              style={{ 
                textAlign: "center", 
                fontSize: twoFactorMode === 'totp' ? "1.5em" : "1.1em",
                letterSpacing: twoFactorMode === 'totp' ? "0.3em" : "0.1em",
                fontFamily: "monospace" 
              }}
            />
            {twoFactorMode === 'totp' && (
              <p className="twofactor-help-text">
                Enter the 6-digit code from your authenticator app
              </p>
            )}
            {twoFactorMode === 'recovery' && (
              <p className="twofactor-help-text">
                Enter one of your unused recovery codes (format: XXXX-XXXX-XXXX-XXXX)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={verifying || (twoFactorMode === 'totp' && twoFactorCode.length !== 6) || (twoFactorMode === 'recovery' && twoFactorCode.trim().length === 0)}
            className="auth-form-submit-btn"
          >
            {verifying ? "Verifying..." : "Verify and sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setTwoFactorRequired(false);
              setTwoFactorTicket(null);
              setChallengeToken(null);
              setTwoFactorCode("");
              setTwoFactorMode('totp');
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
            onClick={() => {
              setShowResetPanel(true);
              setResetMsg("");
              if (!resetEmail && email) {
                setResetEmail(email);
              }
            }}
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
          placeholder="????????"
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

      {/* Phase 8.3: Password reset panel */}
      {showResetPanel && (
        <div className="auth-secondary-panel">
          <h3 className="auth-secondary-panel-title">Reset your password</h3>

          {resetMsg && (
            <div className={`auth-form-status auth-form-status--${resetMsg.includes('required') ? 'error' : 'success'}`} role="alert">
              {resetMsg}
            </div>
          )}

          <form onSubmit={handlePasswordResetRequest}>
            <div className="auth-form-field">
              <label htmlFor="reset-email" className="auth-form-label">
                Email address
              </label>
              <input
                id="reset-email"
                type="email"
                className="auth-form-input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={resetLoading}
                required
              />
            </div>

            <div className="auth-secondary-actions">
              <button
                type="submit"
                disabled={resetLoading}
                className="auth-form-submit-btn"
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </button>

              <button
                type="button"
                className="auth-form-secondary-btn"
                onClick={() => {
                  setShowResetPanel(false);
                  setResetMsg("");
                }}
                disabled={resetLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </form>
  );
}

export default LoginForm;
