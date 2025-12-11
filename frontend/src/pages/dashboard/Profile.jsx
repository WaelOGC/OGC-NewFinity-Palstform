import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/apiClient.js";
import "../../index.css";
import "./dashboard-pages.css";

// TODO: Expand in Phase 2 (permissions, device tracking, verification, wallet linking)

function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Profile fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to get full profile from /user/profile
        try {
          const response = await api.get('/user/profile');
          
          if (response.status === "OK" && response.profile) {
            const profile = response.profile;
            // Ensure we never set "Invalid ID" or invalid values as a field value
            const sanitizeValue = (value) => {
              if (value === null || value === undefined) return "";
              if (typeof value === "string") {
                const trimmed = value.trim();
                if (trimmed === "" || trimmed === "Invalid ID" || trimmed === "null" || trimmed === "undefined") {
                  return "";
                }
                return trimmed;
              }
              // Convert non-string values to string, but filter out invalid ones
              const str = String(value);
              if (str === "Invalid ID" || str === "null" || str === "undefined") {
                return "";
              }
              return str;
            };
            
            setFullName(sanitizeValue(profile.fullName));
            setUsername(sanitizeValue(profile.username));
            setCountry(sanitizeValue(profile.country));
            setBio(sanitizeValue(profile.bio));
            setPhone(sanitizeValue(profile.phone));
            setAvatarUrl(sanitizeValue(profile.avatarUrl));
            return; // Success, exit early
          }
        } catch (profileError) {
          console.warn("Failed to fetch profile from /user/profile, trying fallback:", profileError);
          
          // Fallback: Use data from AuthContext if available
          if (user) {
            const sanitizeValue = (value) => {
              if (value === null || value === undefined) return "";
              if (typeof value === "string") {
                const trimmed = value.trim();
                if (trimmed === "" || trimmed === "Invalid ID" || trimmed === "null" || trimmed === "undefined") {
                  return "";
                }
                return trimmed;
              }
              // Convert non-string values to string, but filter out invalid ones
              const str = String(value);
              if (str === "Invalid ID" || str === "null" || str === "undefined") {
                return "";
              }
              return str;
            };
            
            setFullName(sanitizeValue(user.fullName));
            setUsername(sanitizeValue(user.username));
            setCountry(sanitizeValue(user.country));
            setBio(sanitizeValue(user.bio));
            setPhone(sanitizeValue(user.phone));
            setAvatarUrl(sanitizeValue(user.avatarUrl));
            
            // If we have basic user data, don't show error
            if (user.email) {
              console.log("Using fallback data from AuthContext");
              return;
            }
          }
          
          // If both fail, show error
          throw profileError;
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        const errorMessage = err.backendMessage || err.message || "Failed to load profile";
        setError(errorMessage);
        
        // Don't show "Invalid ID" in fields - clear them and show user-friendly error
        if (errorMessage.includes("Invalid ID") || errorMessage.includes("USER_NOT_FOUND")) {
          setFullName("");
          setUsername("");
          setCountry("");
          setBio("");
          setPhone("");
          setAvatarUrl("");
          setError("Unable to load profile. Please refresh the page or contact support if the issue persists.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Input validation consistent with backend constraints
    if (username && username.length < 3) {
      setError("Username must be at least 3 characters");
      setSaving(false);
      return;
    }
    if (username && username.length > 50) {
      setError("Username must be at most 50 characters");
      setSaving(false);
      return;
    }
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens");
      setSaving(false);
      return;
    }
    if (bio && bio.length > 2000) {
      setError("Bio must be at most 2000 characters");
      setSaving(false);
      return;
    }
    if (fullName && fullName.length > 255) {
      setError("Full name must be at most 255 characters");
      setSaving(false);
      return;
    }
    if (country && country.length > 100) {
      setError("Country must be at most 100 characters");
      setSaving(false);
      return;
    }
    if (phone && phone.length > 20) {
      setError("Phone must be at most 20 characters");
      setSaving(false);
      return;
    }
    if (avatarUrl && avatarUrl.length > 500) {
      setError("Avatar URL must be at most 500 characters");
      setSaving(false);
      return;
    }
    if (avatarUrl && avatarUrl !== "" && !/^https?:\/\/.+/.test(avatarUrl)) {
      setError("Avatar URL must be a valid HTTP/HTTPS URL");
      setSaving(false);
      return;
    }

    try {
      // Build update payload - only include fields that have values or are being cleared
      const updateData = {};
      if (fullName !== undefined && fullName !== null) updateData.fullName = fullName.trim() || null;
      if (username !== undefined && username !== null) updateData.username = username.trim() || null;
      if (country !== undefined && country !== null) updateData.country = country.trim() || null;
      if (bio !== undefined && bio !== null) updateData.bio = bio.trim() || null;
      if (phone !== undefined && phone !== null) updateData.phone = phone.trim() || null;
      if (avatarUrl !== undefined && avatarUrl !== null) updateData.avatarUrl = avatarUrl.trim() || null;

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      console.log("Updating profile with data:", updateData);

      // apiClient handles authentication via cookies, no need for token in headers
      const response = await api.put('/user/profile', updateData);

      if (response.status === "OK") {
        setSuccess(true);
        setError(null); // Clear any previous errors
        
        // Update local state with returned profile data if available
        if (response.profile) {
          const profile = response.profile;
          setFullName(profile.fullName || "");
          setUsername(profile.username || "");
          setCountry(profile.country || "");
          setBio(profile.bio || "");
          setPhone(profile.phone || "");
          setAvatarUrl(profile.avatarUrl || "");
        }
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      const errorMessage = err.backendMessage || err.message || "Failed to update profile";
      setError(errorMessage);
      
      // Don't show "Invalid ID" in error if it's a different issue
      if (errorMessage.includes("Invalid ID")) {
        setError("Unable to update profile. Please refresh the page and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    try {
      // apiClient handles authentication via cookies, no need for token in headers
      const response = await api.put('/user/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.status === "OK") {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(response.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      setPasswordError(err.backendMessage || err.message || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <section className="ogc-dashboard-page">
        <div className="ogc-dashboard-page-header">
          <h1 className="ogc-dashboard-page-title">Profile</h1>
          <p className="ogc-dashboard-page-subtitle">Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ogc-dashboard-page">
      <div className="ogc-dashboard-page-header">
        <h1 className="ogc-dashboard-page-title">Profile</h1>
        <p className="ogc-dashboard-page-subtitle">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Profile Information Section */}
      <div className="ogc-dashboard-card">
        <h2 className="ogc-form-section-title">Profile Information</h2>
        
        {error && (
          <div className="ogc-form-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className="ogc-form-success" style={{ marginBottom: "1rem" }}>
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="ogc-profile-form">
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
            <label htmlFor="username" className="ogc-form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="ogc-form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              pattern="[a-zA-Z0-9_-]+"
              title="Username can only contain letters, numbers, underscores, and hyphens"
            />
            <small className="ogc-form-hint">
              Username can only contain letters, numbers, underscores, and hyphens
            </small>
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
            <label htmlFor="phone" className="ogc-form-label">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              className="ogc-form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="avatarUrl" className="ogc-form-label">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatarUrl"
              className="ogc-form-input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
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
              maxLength={2000}
            />
            <small className="ogc-form-hint">
              {bio.length}/2000 characters
            </small>
          </div>

          <button 
            type="submit" 
            className="ogc-form-submit-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="ogc-dashboard-card" style={{ marginTop: "2rem" }}>
        <h2 className="ogc-form-section-title">Change Password</h2>
        
        {passwordError && (
          <div className="ogc-form-error" style={{ marginBottom: "1rem" }}>
            {passwordError}
          </div>
        )}
        
        {passwordSuccess && (
          <div className="ogc-form-success" style={{ marginBottom: "1rem" }}>
            Password changed successfully!
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="ogc-profile-form">
          <div className="ogc-form-group">
            <label htmlFor="currentPassword" className="ogc-form-label">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              className="ogc-form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="newPassword" className="ogc-form-label">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              className="ogc-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password (min 8 characters)"
              minLength={8}
              required
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="confirmPassword" className="ogc-form-label">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="ogc-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="ogc-form-submit-btn">
            Change Password
          </button>
        </form>
      </div>
    </section>
  );
}

export default Profile;

