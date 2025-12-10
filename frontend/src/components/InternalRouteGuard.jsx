/**
 * Internal Route Guard
 * 
 * Simple token-based protection for internal development routes.
 * Checks for ?key=... query parameter.
 * Uses VITE_INTERNAL_ROUTE_KEY environment variable or defaults to 'DEV1234'.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

const InternalRouteGuard = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const key = params.get('key');

  // Reuse existing secret / key logic
  const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_ROUTE_KEY || 'DEV1234';

  if (key !== INTERNAL_KEY) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default InternalRouteGuard;

