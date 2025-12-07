import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AppProvider, useApp } from './state/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DocsPage from './pages/DocsPage.jsx';
import DevDesignPage from './pages/DevDesignPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import DownloadPage from './pages/DownloadPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InternalRouteGuard from './components/InternalRouteGuard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './index.css';

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
  // All routes with Header - Layout wraps everything
  {
    path: '/',
    element: <Layout />,
    children: [
      // Public routes - accessible to everyone
      { path: '/', element: <LandingPage /> },
      { path: '/auth', element: <AuthPage /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/dev-design', element: <DevDesignPage /> },
      { path: '/download', element: <DownloadPage /> },
      { path: '/community', element: <CommunityPage /> },
      { path: '/coming-soon', element: <ComingSoonPage /> },
      
      // Protected dashboard route
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      
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
    ]
  },
  
  // Legacy routes - redirect to internal (for backward compatibility during transition)
  { path: '/landing', element: <Navigate to="/internal/landing?key=DEV1234" replace /> },
  { path: '/login', element: <Navigate to="/internal/login?key=DEV1234" replace /> },
  { path: '/wallet', element: <Navigate to="/internal/wallet?key=DEV1234" replace /> },
  { path: '/contact', element: <Navigate to="/internal/contact?key=DEV1234" replace /> },
  { path: '/blog', element: <Navigate to="/internal/blog?key=DEV1234" replace /> },
  { path: '/blog/:slug', element: <BlogSlugRedirect /> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);

