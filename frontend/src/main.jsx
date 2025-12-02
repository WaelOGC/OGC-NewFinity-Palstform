import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import DownloadPage from './pages/DownloadPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx';
import InternalRouteGuard from './components/InternalRouteGuard.jsx';

function Protected({ children }) {
  const { accessToken } = useApp();
  if (!accessToken) return <Navigate to="/internal/login?key=DEV1234" replace />;
  return <>{children}</>;
}

// Redirect component for blog slug routes
function BlogSlugRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/internal/blog/${slug}?key=DEV1234`} replace />;
}

const router = createBrowserRouter([
  // Public routes - accessible to everyone
  { path: '/', element: <ComingSoonPage /> },
  { path: '/coming-soon', element: <ComingSoonPage /> },
  
  // Internal development routes - require ?key=DEV1234
  { 
    path: '/internal/landing', 
    element: <InternalRouteGuard><LandingPage /></InternalRouteGuard> 
  },
  { 
    path: '/internal/login', 
    element: <InternalRouteGuard><LoginPage /></InternalRouteGuard> 
  },
  { 
    path: '/internal/wallet', 
    element: <InternalRouteGuard><Protected><WalletPage /></Protected></InternalRouteGuard> 
  },
  { 
    path: '/internal/download', 
    element: <InternalRouteGuard><DownloadPage /></InternalRouteGuard> 
  },
  { 
    path: '/internal/contact', 
    element: <InternalRouteGuard><ContactPage /></InternalRouteGuard> 
  },
  { 
    path: '/internal/community', 
    element: <InternalRouteGuard><CommunityPage /></InternalRouteGuard> 
  },
  { 
    path: '/internal/blog', 
    element: <InternalRouteGuard><BlogPage /></InternalRouteGuard> 
  },
  { 
    path: '/internal/blog/:slug', 
    element: <InternalRouteGuard><BlogPage /></InternalRouteGuard> 
  },
  
  // Legacy routes - redirect to internal (for backward compatibility during transition)
  { path: '/landing', element: <Navigate to="/internal/landing?key=DEV1234" replace /> },
  { path: '/login', element: <Navigate to="/internal/login?key=DEV1234" replace /> },
  { path: '/wallet', element: <Navigate to="/internal/wallet?key=DEV1234" replace /> },
  { path: '/download', element: <Navigate to="/internal/download?key=DEV1234" replace /> },
  { path: '/contact', element: <Navigate to="/internal/contact?key=DEV1234" replace /> },
  { path: '/community', element: <Navigate to="/internal/community?key=DEV1234" replace /> },
  { path: '/blog', element: <Navigate to="/internal/blog?key=DEV1234" replace /> },
  { path: '/blog/:slug', element: <BlogSlugRedirect /> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </React.StrictMode>
);

