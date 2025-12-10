import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./AuthForm.css";

function RegisterForm() {
  const { register, loading, isAuthenticated, user, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return (
      <div className="auth-form-authenticated">
        <div className="auth-form-authenticated-title">You already have an active session</div>
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
    setStatus(null);

    if (!termsAccepted) {
      setStatus({ type: "error", message: "You must accept the Terms & Conditions to create an account" });
      return;
    }

    if (password !== confirm) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, fullName || undefined, termsAccepted);
      // Registration successful - show activation message
      setStatus({ 
        type: "success", 
        message: `We've sent an activation link to ${email}. Please check your inbox and click the link to activate your account.`,
        requiresActivation: true
      });
      setEmail("");
      setFullName("");
      setPassword("");
      setConfirm("");
      setTermsAccepted(false);
    } catch (err) {
      console.error("Register error:", err);
      // Use backendMessage if available, otherwise fall back to message
      const errorMessage = err.backendMessage || err.message || "Registration failed";
      setStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-form-title">Create a new OGC account</div>

      <div className="auth-form-field">
        <label htmlFor="register-name" className="auth-form-label">
          Full name <span className="auth-form-label-optional">(optional)</span>
        </label>
        <input
          id="register-name"
          type="text"
          className="auth-form-input"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="auth-form-field">
        <label htmlFor="register-email" className="auth-form-label">
          Email
        </label>
        <input
          id="register-email"
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
        <label htmlFor="register-password" className="auth-form-label">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          className="auth-form-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <div className="auth-form-field">
        <label htmlFor="register-confirm" className="auth-form-label">
          Confirm password
        </label>
        <input
          id="register-confirm"
          type="password"
          className="auth-form-input"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <div className="auth-form-field">
        <label className="auth-form-checkbox-label">
          <input
            type="checkbox"
            className="auth-form-checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
            aria-required="true"
          />
          <span className="auth-form-checkbox-text">
            I agree to the{" "}
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="auth-form-link">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="auth-form-link">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || loading || !termsAccepted}
        className="auth-form-submit-btn"
        aria-label="Create account"
      >
        {submitting || loading ? "Creating account..." : "Create account"}
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
  );
}

export default RegisterForm;
