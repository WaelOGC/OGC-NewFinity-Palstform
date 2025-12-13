function AdminHome() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--text-secondary, #666)' }}>
        Welcome to the Admin Console. Use the navigation sidebar to access different admin modules.
      </p>
    </div>
  );
}

export default AdminHome;
