import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

/**
 * AdminRouteGuard - Protects admin routes
 * Handles both authentication (redirects to /auth if not logged in)
 * and authorization (redirects to /dashboard if not admin role)
 * Only allows access to users with FOUNDER, CORE_TEAM, or ADMIN role
 * 
 * Uses <Outlet /> to render child routes (React Router v6 pattern)
 */
function AdminRouteGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-300 text-sm">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    // Not logged in → redirect to /auth
    return <Navigate to="/auth" replace />;
  }

  if (!user.role || !ADMIN_ROLES.includes(user.role)) {
    // Logged in but not an admin → send to normal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Admin user → allow access by rendering child routes
  return <Outlet />;
}

export default AdminRouteGuard;
