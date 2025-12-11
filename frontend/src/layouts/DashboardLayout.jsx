import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/sidebar/DashboardSidebar.jsx";
import "../index.css";
import "./dashboard-layout.css";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

function DashboardLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Phase 5: Role badge configuration
  const getRoleBadge = (role) => {
    const badges = {
      FOUNDER: { label: 'Founder', className: 'role-badge-founder' },
      CORE_TEAM: { label: 'Core Team', className: 'role-badge-core-team' },
      ADMIN: { label: 'Admin', className: 'role-badge-admin' },
      MODERATOR: { label: 'Moderator', className: 'role-badge-moderator' },
      CREATOR: { label: 'Creator', className: 'role-badge-creator' },
      STANDARD_USER: null, // No badge for standard users
      SUSPENDED: { label: 'Suspended', className: 'role-badge-suspended' },
      BANNED: { label: 'Banned', className: 'role-badge-banned' },
    };
    return badges[role] || null;
  };

  const roleBadge = user?.role ? getRoleBadge(user.role) : null;
  
  // Phase 6: Check if user has admin access
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  return (
    <div className="ogc-dashboard-root">
      <header className="ogc-dashboard-topbar">
        <div className="ogc-dashboard-logo">OGC <span>NewFinity</span></div>
        <div className="ogc-dashboard-topbar-right">
          {roleBadge && (
            <span className={`role-badge ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          )}
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')} 
              className="ogc-admin-console-btn"
              title="Admin Console"
            >
              Admin Console
            </button>
          )}
          <button onClick={logout} className="ogc-logout-btn">Log out</button>
        </div>
      </header>

      <div className="ogc-dashboard-body">
        <aside className="ogc-dashboard-sidebar">
          <Sidebar />
        </aside>
        <main className="ogc-dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

