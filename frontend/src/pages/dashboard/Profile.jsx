import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import "../../index.css";
import "./dashboard-pages.css";

function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Profile saving not implemented yet.");
  };

  return (
    <section className="ogc-dashboard-page">
      <div className="ogc-dashboard-page-header">
        <h1 className="ogc-dashboard-page-title">Profile</h1>
        <p className="ogc-dashboard-page-subtitle">
          Manage your personal information and account settings.
        </p>
      </div>

      <div className="ogc-dashboard-card">
        <form onSubmit={handleSubmit} className="ogc-profile-form">
          <div className="ogc-form-group">
            <label htmlFor="fullName" className="ogc-form-label">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              className="ogc-form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="country" className="ogc-form-label">
              Country
            </label>
            <input
              type="text"
              id="country"
              className="ogc-form-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter your country"
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="bio" className="ogc-form-label">
              Bio
            </label>
            <textarea
              id="bio"
              className="ogc-form-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <button type="submit" className="ogc-form-submit-btn">
            Save changes
          </button>
        </form>
      </div>
    </section>
  );
}

export default Profile;

