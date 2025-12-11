import { NavLink } from "react-router-dom";
import "./dashboard-sidebar.css";

const links = [
  { to: "/dashboard/overview", label: "Overview" },
  { to: "/dashboard/profile", label: "Profile" },
  { to: "/dashboard/security", label: "Security" },
];

function DashboardSidebar() {
  return (
    <nav className="ogc-dsb-nav">
      <div className="ogc-dsb-section-label">Dashboard</div>
      <ul className="ogc-dsb-list">
        {links.map(link => (
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
  );
}

export default DashboardSidebar;

