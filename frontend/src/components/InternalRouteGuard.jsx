/**
 * Internal Route Guard
 * 
 * Simple token-based protection for internal development routes.
 * Checks for ?key=DEV1234 query parameter.
 */

import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';

const INTERNAL_DEV_KEY = 'DEV1234'; // Simple dev key - can be changed

export default function InternalRouteGuard({ children }) {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key');

  if (key === INTERNAL_DEV_KEY) {
    return <>{children}</>;
  }

  // Redirect to coming soon page if key is missing or incorrect
  return <Navigate to="/" replace />;
}

