import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

/**
 * AdminRouteGuard - Protects admin routes
 * Handles both authentication (redirects to /auth if not logged in)
 * and authorization (redirects to /dashboard if not admin role/permission)
 * Allows access to users with:
 * - FOUNDER, CORE_TEAM, or ADMIN role, OR
 * - VIEW_ADMIN_DASHBOARD or MANAGE_USERS permission
 * 
 * Uses <Outlet /> to render child routes (React Router v6 pattern)
 */
function AdminRouteGuard() {
  const { user, loading, hasAnyRole, hasAnyPermission } = useAuth();
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

  // Check if user has admin access (role OR permission)
  const hasAdminRole = hasAnyRole(ADMIN_ROLES);
  const hasAdminPermission = hasAnyPermission(['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']);

  if (!hasAdminRole && !hasAdminPermission) {
    // Logged in but not an admin → send to normal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Admin user → allow access by rendering child routes
  return <Outlet />;
}

export default AdminRouteGuard;
