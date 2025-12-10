import { useState } from "react";
import LoginForm from "../../components/LoginForm.jsx";
import RegisterForm from "../../components/RegisterForm.jsx";
import SocialLogin from "../../components/SocialLogin.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./styles.css";

function AuthPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("signin");

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
