import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AdminNotAuthorized from "../pages/admin/AdminNotAuthorized.jsx";
import { useState, useEffect } from "react";
import { getAdminNavigation } from "../utils/apiClient.js";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

/**
 * AdminRouteGuard - Protects admin routes
 * Handles both authentication (redirects to /auth if not logged in)
 * and authorization (checks via navigation API; shows not authorized if fails)
 * Allows access to users with:
 * - FOUNDER, CORE_TEAM, or ADMIN role, OR
 * - VIEW_ADMIN_DASHBOARD or MANAGE_USERS permission
 * 
 * Uses <Outlet /> to render child routes (React Router v6 pattern)
 */
function AdminRouteGuard() {
  const { user, loading, hasAnyRole, hasAnyPermission } = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Check authorization via navigation API
  useEffect(() => {
    async function checkAuthorization() {
      if (loading || !user) {
        setCheckingAuth(false);
        return;
      }

      // First check local auth context (fast path)
      const hasAdminRole = hasAnyRole(ADMIN_ROLES);
      const hasAdminPermission = hasAnyPermission(['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']);

      if (hasAdminRole || hasAdminPermission) {
        setAuthorized(true);
        setCheckingAuth(false);
        return;
      }

      // If local check fails, try navigation API as fallback
      try {
        await getAdminNavigation();
        setAuthorized(true);
      } catch (error) {
        // 401 or 403 means not authorized
        if (error.httpStatus === 401 || error.httpStatus === 403 || error.code === 'AUTH_REQUIRED' || error.code === 'ADMIN_REQUIRED') {
          setAuthorized(false);
        } else {
          // Other errors - assume authorized but let AdminLayout handle the error
          setAuthorized(true);
        }
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuthorization();
  }, [user, loading, hasAnyRole, hasAnyPermission]);

  if (loading || checkingAuth) {
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

  if (!authorized) {
    // Logged in but not authorized → show not authorized page
    return <AdminNotAuthorized />;
  }

  // Admin user → allow access by rendering child routes
  return <Outlet />;
}

export default AdminRouteGuard;
