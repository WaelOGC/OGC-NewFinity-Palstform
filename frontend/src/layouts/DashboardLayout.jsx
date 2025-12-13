import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { Bell, MessageCircle, SunMedium, Moon } from 'lucide-react';
import Sidebar from "../components/sidebar/DashboardSidebar.jsx";
import ScrollToTopButton from "../components/common/ScrollToTopButton.jsx";
import OGCLogo from "../components/branding/OGCLogo.jsx";
import "../index.css";
import "./dashboard-layout.css";

const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

function DashboardLayout() {
  const { logout, user, hasAnyRole, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [hasUnreadNotifications] = useState(true); // mock for now
  const [hasUnreadSystemMessages] = useState(false);
  const accountMenuRef = useRef(null);

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  function handleLogout() {
    setIsAccountMenuOpen(false);
    logout();
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

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

  // Get role badge - check both user.role (singular) and user.roles (array)
  const userRole = user?.role || (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles[0] : null);
  const roleBadge = userRole ? getRoleBadge(userRole) : null;
  
  // Phase 6: Check if user has admin access (role OR permission)
  const isAdmin = hasAnyRole(ADMIN_ROLES) || hasAnyPermission(['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']);

  return (
    <div className="ogc-dashboard-root">
      <header className="ogc-dashboard-topbar">
        <div className="ogc-dashboard-logo">
          <OGCLogo />
        </div>
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
          
          {/* PHASE W2.9: Header actions */}
          <div className="dashboard-header-actions">
            {/* Notifications */}
            <button
              type="button"
              className="header-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="header-icon" size={18} />
              {hasUnreadNotifications && <span className="header-icon-dot" />}
            </button>

            {/* System messages */}
            <button
              type="button"
              className="header-icon-btn"
              aria-label="System messages"
              title="System messages"
            >
              <MessageCircle className="header-icon" size={18} />
              {hasUnreadSystemMessages && <span className="header-icon-dot" />}
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              className="header-icon-btn"
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Moon className="header-icon" size={18} />
              ) : (
                <SunMedium className="header-icon" size={18} />
              )}
            </button>

            {/* Account menu */}
            <div className="header-account-wrapper" ref={accountMenuRef}>
              <button
                type="button"
                className="header-account-btn"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                aria-label="Account menu"
              >
                <div className="header-account-avatar">{getUserInitials()}</div>
                <span className="header-account-caret" />
              </button>

              {isAccountMenuOpen && (
                <div className="header-account-menu">
                  <div className="header-account-menu-header">
                    <div className="name">{user?.displayName || user?.username || 'User'}</div>
                    <div className="email">{user?.email || '—'}</div>
                  </div>
                  <button 
                    type="button" 
                    className="header-account-menu-item"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      navigate('/dashboard/profile');
                    }}
                  >
                    Account settings
                  </button>
                  <button 
                    type="button" 
                    className="header-account-menu-item"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      navigate('/dashboard/security');
                    }}
                  >
                    Security settings
                  </button>
                  <button 
                    type="button" 
                    className="header-account-menu-item"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      navigate('/dashboard/overview');
                    }}
                  >
                    Go to main dashboard
                  </button>
                  {isAdmin && (
                    <button 
                      type="button" 
                      className="header-account-menu-item"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        navigate('/admin');
                      }}
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    type="button"
                    className="header-account-menu-item header-account-menu-item--danger"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="ogc-dashboard-body">
        <aside className="ogc-dashboard-sidebar">
          <Sidebar />
        </aside>
        <main className="ogc-dashboard-main">
          <div className="dashboard-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

export default DashboardLayout;

