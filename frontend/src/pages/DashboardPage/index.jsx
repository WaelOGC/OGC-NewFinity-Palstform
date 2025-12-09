import { useAuth } from "../../context/AuthContext.jsx";
import "../../index.css";
import './styles.css';

function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--ogc-bg)',
      color: 'var(--ogc-fg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '36rem',
        width: '100%',
        borderRadius: '1rem',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        backgroundColor: 'var(--card-bg, rgba(15, 23, 42, 0.6))',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(6, 182, 212, 0.2)'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '8px',
          color: 'var(--ogc-fg)'
        }}>
          Welcome to your OGC Dashboard
        </h1>
        <p style={{
          fontSize: '0.875rem',
          marginBottom: '16px',
          color: 'var(--ogc-fg)',
          opacity: 0.8
        }}>
          This is the early developer dashboard preview. As the platform grows,
          this area will surface your tokens, activity, and agent tools.
        </p>

        <div style={{
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          backgroundColor: 'var(--card-bg, rgba(15, 23, 42, 0.6))',
          padding: '16px',
          fontSize: '0.875rem',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--ogc-fg)' }}>Account</div>
          <div style={{ color: 'var(--ogc-fg)', opacity: 0.9 }}>Email: {user?.email}</div>
          {user?.fullName && <div style={{ color: 'var(--ogc-fg)', opacity: 0.9 }}>Name: {user.fullName}</div>}
        </div>

        <button
          type="button"
          onClick={logout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '0.375rem',
            backgroundColor: '#ef4444',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f87171'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
