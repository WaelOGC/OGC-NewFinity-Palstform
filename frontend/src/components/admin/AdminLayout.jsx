import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "../sidebar/dashboard-sidebar.css";
import "./admin-layout.css";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

function AdminLayout() {
  const { user, logout } = useAuth();
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

  const roleBadge = user?.role ? getRoleBadge(user.role) : null;

  // Note: Access control is handled by AdminRouteGuard, so we don't need to check here
  // If this component renders, the user is already authenticated and has admin role

  const adminLinks = [
    { to: "/admin/users", label: "Users" },
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
          <span className="ogc-admin-title">Admin Console</span>
        </div>
        <div className="ogc-admin-topbar-right">
          {roleBadge && (
            <span className={`role-badge ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          )}
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
                    {link.label}
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
