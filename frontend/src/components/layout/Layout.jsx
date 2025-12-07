/**
 * Layout Component
 * 
 * Wraps all routes with the global Header component.
 * Used to ensure consistent navigation across all pages.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
  return (
    <>
      <Header />
      <main className="app-main" style={{ 
        minHeight: 'calc(100vh - 70px)',
        backgroundColor: 'var(--ogc-bg)',
        transition: 'background-color 0.4s ease'
      }}>
        <Outlet />
      </main>
    </>
  );
}
