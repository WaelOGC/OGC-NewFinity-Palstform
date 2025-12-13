import { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { getAdminNavigation } from "../../utils/apiClient.js";
import { hasAdminPermission, ADMIN_USERS_READ } from "../../utils/adminPermissions.js";
import OGCLogo from "../../components/branding/OGCLogo.jsx";
import "../../components/sidebar/dashboard-sidebar.css";
import "../../components/admin/admin-layout.css";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [degradedMode, setDegradedMode] = useState(false);

  // Fetch navigation on mount
  useEffect(() => {
    async function fetchNavigation() {
      try {
        setLoading(true);
        setError(null);
        
        // Use fetch directly to check response headers for degraded mode
        const response = await fetch('/api/v1/admin/navigation', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Check degraded mode header
        const adminMode = response.headers.get('x-admin-mode');
        if (adminMode === 'degraded') {
          setDegradedMode(true);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        if (data?.status === 'ERROR') {
          throw new Error(data.message || 'Failed to load navigation');
        }

        if (data?.status === 'OK' && data?.data) {
          setNavigation(data.data);
        } else {
          throw new Error('Invalid navigation response');
        }
      } catch (err) {
        console.error('Failed to fetch admin navigation:', err);
        // Handle AppError from apiClient if it bubbles up
        const errorMessage = err.message || err.backendMessage || 'Failed to load navigation';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchNavigation();
  }, []);

  // Role badge configuration
  const getRoleBadge = (role) => {
    const badges = {
      FOUNDER: { label: 'Founder', className: 'role-badge-founder' },
      CORE_TEAM: { label: 'Core Team', className: 'role-badge-core-team' },
      ADMIN: { label: 'Admin', className: 'role-badge-admin' },
    };
    return badges[role] || null;
  };

  // Get role badge - check both user.role (singular) and user.roles (array)
  const userRole = user?.role || (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : null);
  const roleBadge = userRole ? getRoleBadge(userRole) : null;

  // Render loading state
  if (loading) {
    return (
      <div className="ogc-admin-root">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          color: 'var(--text-secondary, #666)'
        }}>
          Loading admin navigation...
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="ogc-admin-root">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary, #333)' }}>
            Error Loading Navigation
          </h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary, #666)' }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary, #0066cc)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ogc-admin-root">
      {/* Degraded mode banner */}
      {degradedMode && (
        <div style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          fontSize: '0.875rem'
        }}>
          Admin dashboard is operating in degraded mode. Some features may be limited.
        </div>
      )}

      <header className="ogc-admin-topbar">
        <div className="ogc-admin-logo">
          <button onClick={() => navigate('/dashboard')} className="ogc-admin-back-btn">
            ← Dashboard
          </button>
          <OGCLogo className="ogc-admin-logo-img" />
          <span className="ogc-admin-title">Admin Console</span>
        </div>
        <div className="ogc-admin-topbar-right">
          {roleBadge && (
            <span className={`role-badge ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="ogc-admin-theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
          <span className="ogc-admin-user-name">{user?.fullName || user?.email}</span>
          <button onClick={logout} className="ogc-logout-btn">Log out</button>
        </div>
      </header>

      <div className="ogc-admin-body">
        <aside className="ogc-admin-sidebar">
          <nav className="ogc-dsb-nav">
            {navigation?.groups?.map((group) => (
              <div key={group.groupId}>
                <div className="ogc-dsb-section-label">{group.groupLabel}</div>
                <ul className="ogc-dsb-list">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <NavLink
                        to={item.uiRoute}
                        className={({ isActive }) =>
                          "ogc-dsb-link" + (isActive ? " ogc-dsb-link-active" : "")
                        }
                      >
                        <span className="ogc-dsb-link-text">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <main className="ogc-admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
