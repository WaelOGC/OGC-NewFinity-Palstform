import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Temporary debug log
  console.log('[ProtectedRoute] path:', location.pathname, 'isAuthenticated:', isAuthenticated, 'user:', user);

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
        to="/auth"
        replace
        state={{ from: location.pathname || "/dashboard" }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
