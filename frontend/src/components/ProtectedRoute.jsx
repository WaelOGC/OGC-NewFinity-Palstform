import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-300 text-sm">
        Checking your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname || "/dashboard" }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
