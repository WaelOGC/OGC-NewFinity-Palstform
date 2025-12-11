import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/sidebar/DashboardSidebar.jsx";
import "../index.css";
import "./dashboard-layout.css";

function DashboardLayout() {
  const { logout } = useAuth();

  return (
    <div className="ogc-dashboard-root">
      <header className="ogc-dashboard-topbar">
        <div className="ogc-dashboard-logo">OGC <span>NewFinity</span></div>
        <div className="ogc-dashboard-topbar-right">
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

