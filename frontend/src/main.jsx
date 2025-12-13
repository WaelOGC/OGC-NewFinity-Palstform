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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import DashboardWalletPage from './pages/dashboard/WalletPage.jsx';
import ChallengePage from './pages/dashboard/ChallengePage.jsx';
import AmyAgentShell from './pages/amy/AmyAgentShell.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage.jsx';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage.jsx';
import AdminRolesPage from './pages/admin/AdminRolesPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminSystemHealthPage from './pages/admin/AdminSystemHealthPage.jsx';
import AdminSystemJobsPage from './pages/admin/AdminSystemJobsPage.jsx';
import AdminSessionsPage from './pages/admin/AdminSessionsPage.jsx';
import InternalRouteGuard from './components/InternalRouteGuard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRouteGuard from './components/AdminRouteGuard.jsx';
import BlogSlugRedirect from './components/BlogSlugRedirect.jsx';
import ComingSoon from './pages/ComingSoon/index.jsx';
import FeatureGate from './components/FeatureGate.jsx';
import { FEATURE_FLAGS } from './config/featureFlags.js';
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
      { path: '/activate', element: <ActivationPage /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
      { path: '/auth/social/callback', element: <SocialAuthCallback /> },
      { path: '/docs', element: <DocsPage /> },
      { path: '/dev-design', element: <DevDesignPage /> },
      { path: '/download', element: <FeatureGate enabled={FEATURE_FLAGS.DOWNLOADS} featureName="Downloads"><DownloadPage /></FeatureGate> },
      { path: '/community', element: <CommunityPage /> },
      { path: '/coming-soon', element: <ComingSoonPage /> },
      
      // Internal/system-only routes - require ?key=DEV1234
      {
        element: <InternalRouteGuard />,
        children: [
          { path: '/internal/landing', element: <LandingPage /> },
          { path: '/internal/login', element: <LoginPage /> },
          { path: '/internal/download', element: <FeatureGate enabled={FEATURE_FLAGS.DOWNLOADS} featureName="Downloads"><DownloadPage /></FeatureGate> },
          { path: '/internal/contact', element: <ContactPage /> },
          { path: '/internal/community', element: <CommunityPage /> },
          { path: '/internal/blog', element: <BlogPage /> },
          { path: '/internal/blog/:slug', element: <BlogPage /> },
          // Internal wallet route - requires both internal key AND authentication
          {
            element: <ProtectedRoute />,
            children: [
              { path: '/internal/wallet', element: <FeatureGate enabled={FEATURE_FLAGS.WALLET} featureName="Wallet"><WalletPage /></FeatureGate> },
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
          { path: 'wallet', element: <FeatureGate enabled={FEATURE_FLAGS.WALLET} featureName="Wallet"><DashboardWalletPage /></FeatureGate> },
          { path: 'challenge', element: <FeatureGate enabled={FEATURE_FLAGS.CHALLENGE_PROGRAM} featureName="Challenge Program"><ChallengePage /></FeatureGate> },
        ],
      },
      // Amy Agent Shell - full-screen layout (no dashboard sidebar)
      {
        path: '/amy',
        element: <FeatureGate enabled={FEATURE_FLAGS.AMY_AGENT} featureName="Amy Agent"><AmyAgentShell /></FeatureGate>,
      },
    ],
  },
  
  // Admin Console routes - requires admin role (Phase 6)
  // 
  // ROUTING STRUCTURE:
  // - AdminRouteGuard wraps all /admin/* routes and handles:
  //   * Authentication check (redirects to /auth if not logged in)
  //   * Authorization check (redirects to /dashboard if not admin role)
  //   * Uses <Outlet /> to render child routes (React Router v6 pattern)
  // 
  // - AdminLayout provides the admin UI shell (sidebar, header, etc.)
  //   * Uses <Outlet /> to render admin page content
  // 
  // - Nested routes under /admin/*:
  //   * /admin → shows AdminUsersPage (index route)
  //   * /admin/users → shows AdminUsersPage (explicit route)
  // 
  // Note: AdminRouteGuard must use <Outlet />, not {children}, to work with React Router v6
  {
    element: <AdminRouteGuard />,
    children: [
      {
        path: '/admin/*',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'users/:userId', element: <AdminUserDetailPage /> },
          { path: 'audit-logs', element: <AdminAuditLogsPage /> },
          { path: 'roles', element: <AdminRolesPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'health', element: <AdminSystemHealthPage /> },
          { path: 'jobs', element: <AdminSystemJobsPage /> },
          { path: 'sessions', element: <AdminSessionsPage /> },
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

