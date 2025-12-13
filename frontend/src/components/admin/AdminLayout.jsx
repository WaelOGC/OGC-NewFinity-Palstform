import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import OGCLogo from "../branding/OGCLogo.jsx";
import "../sidebar/dashboard-sidebar.css";
import "./admin-layout.css";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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

  // Note: Access control is handled by AdminRouteGuard, so we don't need to check here
  // If this component renders, the user is already authenticated and has admin role

  const adminLinks = [
    { to: "/admin/users", label: "Users", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )},
    { to: "/admin/audit-logs", label: "Audit Logs", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )},
    // Placeholders for future admin sections
    // { to: "/admin/roles", label: "Roles" },
    // { to: "/admin/feature-flags", label: "Feature Flags" },
    // { to: "/admin/system", label: "System" },
  ];

  return (
    <div className="ogc-admin-root">
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
            <div className="ogc-dsb-section-label">Admin</div>
            <ul className="ogc-dsb-list">
              {adminLinks.map(link => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      "ogc-dsb-link" + (isActive ? " ogc-dsb-link-active" : "")
                    }
                  >
                    {link.icon && <span className="ogc-dsb-link-icon">{link.icon}</span>}
                    <span className="ogc-dsb-link-text">{link.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
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
