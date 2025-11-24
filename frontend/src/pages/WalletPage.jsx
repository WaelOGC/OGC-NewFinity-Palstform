import React, { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { walletApi } from '../api/wallet.js';

export default function WalletPage() {
  const { accessToken } = useApp();
  const api = walletApi(() => accessToken);

  const [summary, setSummary] = useState(null);
  const [tx, setTx] = useState({ items: [], total: 0 });
  const [error, setError] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const fmt = new Intl.NumberFormat('en-US');

  useEffect(() => {
    (async () => {
      try {
        const s = await api.summary();
        setSummary(s);
        const t = await api.transactions({ page: 1, pageSize: 10 });
        setTx(t);
      } catch (e) {
        setError(e.message || 'Failed to load wallet');
      }
    })();
  }, []);

  async function handleDemoClick() {
    setLoadingDemo(true);
    setError(null);
    try {
      await api.createDemoTransactions();
      const s = await api.summary();
      setSummary(s);
      const t = await api.transactions({ page: 1, pageSize: 10 });
      setTx(t);
    } catch (e) {
      setError(e.message || 'Failed to create demo transactions');
    } finally {
      setLoadingDemo(false);
    }
  }

  if (!summary) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1>Wallet</h1>
      {error && <p style={{ color: 'crimson', marginTop: 8, marginBottom: 16 }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card title="Balance" value={fmt.format(Number(summary.balance))}/>
        <Card title="Staked" value={fmt.format(Number(summary.staked))}/>
        <Card title="Rewards" value={fmt.format(Number(summary.rewards))}/>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Transactions</h2>
        <button
          onClick={handleDemoClick}
          disabled={loadingDemo}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', cursor: loadingDemo ? 'default' : 'pointer' }}
        >
          {loadingDemo ? 'Generating…' : 'Generate Demo Transactions'}
        </button>
      </div>
      <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th>Type</th><th>Amount</th><th>Status</th><th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tx.items.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{t.type}</td>
              <td>{fmt.format(Number(t.amount))}</td>
              <td>{t.status}</td>
              <td>{new Date(t.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {tx.items.length === 0 && (
            <tr><td colSpan={4} style={{ color: '#666' }}>No transactions yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
      <div style={{ color: '#666', fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

