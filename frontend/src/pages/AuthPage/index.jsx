import LoginForm from "../../components/LoginForm.jsx";
import RegisterForm from "../../components/RegisterForm.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import "./styles.css";

function AuthPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <h1 className="auth-page-title">
          {isAuthenticated ? "Your session" : "Access OGC NewFinity"}
        </h1>
        <p className="auth-page-subtitle">
          Sign in to your existing account or create a new one to access
          dashboards, agent tools, and upcoming ecosystem features.
        </p>

        <div className="auth-page-forms">
          <div className="auth-page-form-column">
            <LoginForm />
          </div>
          <div className="auth-page-form-column">
            <RegisterForm />
          </div>
        </div>

        {isAuthenticated && (
          <p className="auth-page-authenticated">
            You are currently signed in as {user?.email}.
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
