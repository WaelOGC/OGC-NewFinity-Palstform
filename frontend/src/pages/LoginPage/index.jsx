import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext.jsx';
import { authApi } from '../../api/auth.js';
import './styles.css';

export default function LoginPage() {
  const nav = useNavigate();
  const { setAccessToken, accessToken } = useApp();
  const api = authApi(() => accessToken);

  const [email, setEmail] = useState('admin@ogc.local');
  const [password, setPassword] = useState('ChangeMe!123');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access } = await api.login(email, password);
      setAccessToken(access);
      nav('/wallet', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1>OGC NewFinity – Login</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br/>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={{ width: '100%', padding: 10 }}/>
        </label>
        <br/><br/>
        <label>Password<br/>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={{ width: '100%', padding: 10 }}/>
        </label>
        <br/><br/>
        <button type="submit" disabled={busy} style={{ padding: '10px 16px' }}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </form>
    </div>
  );
}
