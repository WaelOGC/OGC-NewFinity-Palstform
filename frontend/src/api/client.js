const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export function createClient(getToken) {
  async function request(path, opts = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}/api/v1${path}`, { ...opts, headers });
    if (!res.ok) {
      const error = await safeJson(res);
      throw new Error(error?.error || `HTTP ${res.status}`);
    }
    return safeJson(res);
  }
  return { get: (p) => request(p), post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body || {}) }) };
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

