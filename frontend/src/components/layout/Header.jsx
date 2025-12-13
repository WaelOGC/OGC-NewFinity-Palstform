/**
 * Global Header Component
 * 
 * Provides navigation across all pages with:
 * - OGC NewFinity branding/logo
 * - Navigation links (Home, Docs, Dev & Design)
 * - Responsive hamburger menu for mobile
 * - Active route highlighting
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import OGCLogo from '../branding/OGCLogo.jsx';
import './Header.css';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  function handleAccountClick() {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  }

  return (
    <header className="global-header">
      <div className="header-container">
        {/* Logo/Brand */}
        <NavLink to="/" className="header-logo" onClick={closeMobileMenu}>
          <OGCLogo />
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            end
          >
            Home
          </NavLink>
          <NavLink 
            to="/docs" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Docs
          </NavLink>
          <NavLink 
            to="/dev-design" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Dev & Design
          </NavLink>
        </nav>

        {/* Header Icons */}
        <div className="header-icons">
          <button
            type="button"
            onClick={toggleTheme}
            className="header-icon-button"
            aria-label="Toggle theme"
          >
            {isDark ? "☾" : "☀"}
          </button>
          <button
            type="button"
            onClick={handleAccountClick}
            className="header-icon-button"
            aria-label="Account"
          >
            <span className="font-semibold">ID</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <nav className={`header-nav mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={closeMobileMenu}
          end
        >
          Home
        </NavLink>
        <NavLink 
          to="/docs" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={closeMobileMenu}
        >
          Docs
        </NavLink>
        <NavLink 
          to="/dev-design" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          onClick={closeMobileMenu}
        >
          Dev & Design
        </NavLink>
      </nav>
    </header>
  );
}
