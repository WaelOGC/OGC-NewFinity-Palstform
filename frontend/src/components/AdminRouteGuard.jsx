import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

/**
 * AdminRouteGuard - Protects admin routes
 * Handles both authentication (redirects to /auth if not logged in)
 * and authorization (redirects to /dashboard if not admin role)
 * Only allows access to users with FOUNDER, CORE_TEAM, or ADMIN role
 */
function AdminRouteGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Temporary debug log to help debug role propagation
  console.log('[AdminRouteGuard] path:', location.pathname, 'user:', user, 'user role:', user?.role, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-300 text-sm">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    // Not logged in → redirect to /auth
    console.log('[AdminRouteGuard] No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (!user.role || !ADMIN_ROLES.includes(user.role)) {
    // Logged in but not an admin → send to normal dashboard
    console.log('[AdminRouteGuard] User role is not admin:', user.role, 'redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Admin user → allow access
  console.log('[AdminRouteGuard] Admin access granted, rendering children');
  return children;
}

export default AdminRouteGuard;
