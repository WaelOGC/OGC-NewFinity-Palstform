import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WalletPage from './pages/WalletPage.jsx';

function Protected({ children }) {
  const { accessToken } = useApp();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/wallet" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/wallet', element: <Protected><WalletPage /></Protected> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </React.StrictMode>
);

