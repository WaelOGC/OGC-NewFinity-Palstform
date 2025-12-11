import { useAuth } from "../../context/AuthContext.jsx";
import "../../index.css";
import "./dashboard-pages.css";

function Overview() {
  const { user } = useAuth();

  return (
    <section className="ogc-dashboard-page">
      <div className="ogc-dashboard-page-header">
        <h1 className="ogc-dashboard-page-title">Overview</h1>
        <p className="ogc-dashboard-page-subtitle">
          Welcome to your OGC Dashboard. This is the early developer dashboard preview.
          As the platform grows, this area will surface your tokens, activity, and agent tools.
        </p>
      </div>

      <div className="ogc-dashboard-card">
        <h2 className="ogc-dashboard-card-title">Welcome to your OGC Dashboard</h2>
        <p className="ogc-dashboard-card-text">
          This is the early developer dashboard preview. As the platform grows,
          this area will surface your tokens, activity, and agent tools.
        </p>

        <div className="ogc-dashboard-info-box">
          <div className="ogc-dashboard-info-label">Account</div>
          <div className="ogc-dashboard-info-value">Email: {user?.email}</div>
          {user?.fullName && (
            <div className="ogc-dashboard-info-value">Name: {user.fullName}</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Overview;

