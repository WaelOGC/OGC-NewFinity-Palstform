import { NavLink } from "react-router-dom";
import { FEATURE_FLAGS } from "../../config/featureFlags.js";
import "./dashboard-sidebar.css";

const links = [
  { to: "/dashboard/overview", label: "Overview", featureFlag: null },
  { to: "/dashboard/profile", label: "Profile", featureFlag: null },
  { to: "/dashboard/security", label: "Security", featureFlag: null },
  { to: "/dashboard/wallet", label: "Wallet", featureFlag: "WALLET" },
  { to: "/dashboard/challenge", label: "Challenge Program", featureFlag: "CHALLENGE_PROGRAM" },
];

function DashboardSidebar() {
  // Always show all links - no filtering
  // If a feature is disabled, the route will show Coming Soon page instead

  return (
    <nav className="ogc-dsb-nav">
      <div className="ogc-dsb-section-label">Dashboard</div>
      <ul className="ogc-dsb-list">
        {links.map(link => {
          const isEnabled = link.featureFlag === null || FEATURE_FLAGS[link.featureFlag] === true;
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  "ogc-dsb-link" + (isActive ? " ogc-dsb-link-active" : "")
                }
              >
                {link.label}
                {!isEnabled && link.featureFlag && (
                  <span className="ogc-dsb-badge" style={{ 
                    marginLeft: "8px", 
                    fontSize: "0.7rem", 
                    opacity: 0.7,
                    fontStyle: "italic"
                  }}>Preview</span>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default DashboardSidebar;

