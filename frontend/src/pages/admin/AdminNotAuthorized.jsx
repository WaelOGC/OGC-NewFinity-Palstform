import { Link } from "react-router-dom";

function AdminNotAuthorized() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary, #333)' }}>
        Access Denied
      </h1>
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary, #666)' }}>
        You don't have permission to access the Admin Console.
      </p>
      <Link 
        to="/dashboard"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--primary, #0066cc)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          display: 'inline-block'
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export default AdminNotAuthorized;
