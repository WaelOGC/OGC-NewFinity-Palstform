import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WalletPage from './pages/WalletPage.jsx';
import DownloadPage from './pages/DownloadPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';
import BlogPage from './pages/BlogPage.jsx';

function Protected({ children }) {
  const { accessToken } = useApp();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/wallet', element: <Protected><WalletPage /></Protected> },
  { path: '/download', element: <DownloadPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/community', element: <CommunityPage /> },
  { path: '/blog', element: <BlogPage /> },
  { path: '/blog/:slug', element: <BlogPage /> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </React.StrictMode>
);

