import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AppProvider } from './state/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ActivationPage from './pages/ActivationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SocialAuthCallback from './pages/SocialAuthCallback';
import DocsPage from './pages/DocsPage';
import DevDesignPage from './pages/DevDesignPage';
import LoginPage from './pages/LoginPage';
import WalletPage from './pages/WalletPage';
import DownloadPage from './pages/DownloadPage';
import ContactPage from './pages/ContactPage';
import CommunityPage from './pages/CommunityPage';
import BlogPage from './pages/BlogPage';
import ComingSoonPage from './pages/ComingSoonPage';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import Profile from './pages/dashboard/Profile.jsx';
import Security from './pages/dashboard/Security.jsx';
import InternalRouteGuard from './components/InternalRouteGuard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import BlogSlugRedirect from './components/BlogSlugRedirect.jsx';
import './index.css';

const router = createBrowserRouter([
  // All routes with Header - Layout wraps everything
  {
    path: '/',
    element: <Layout />,
    children: [
      // Public routes - accessible to everyone
      { path: '/', element: <LandingPage /> },
      { path: '/auth', element: <AuthPage /> },
      { path: '/auth/activate', element: <ActivationPage /> },
      { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
      { path: '/auth/social/callback', element: <SocialAuthCallback /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/dev-design', element: <DevDesignPage /> },
      { path: '/download', element: <DownloadPage /> },
      { path: '/community', element: <CommunityPage /> },
      { path: '/coming-soon', element: <ComingSoonPage /> },
      
      // Internal/system-only routes - require ?key=DEV1234
      {
        element: <InternalRouteGuard />,
        children: [
          { path: '/internal/landing', element: <LandingPage /> },
          { path: '/internal/login', element: <LoginPage /> },
          { path: '/internal/download', element: <DownloadPage /> },
          { path: '/internal/contact', element: <ContactPage /> },
          { path: '/internal/community', element: <CommunityPage /> },
          { path: '/internal/blog', element: <BlogPage /> },
          { path: '/internal/blog/:slug', element: <BlogPage /> },
          // Internal wallet route - requires both internal key AND authentication
          {
            element: <ProtectedRoute />,
            children: [
              { path: '/internal/wallet', element: <WalletPage /> },
            ],
          },
        ],
      },
    ]
  },
  
  // Dashboard routes - separate layout with DashboardLayout (outside main Layout)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'overview', element: <Overview /> },
          { path: 'profile', element: <Profile /> },
          { path: 'security', element: <Security /> },
        ],
      },
    ],
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

