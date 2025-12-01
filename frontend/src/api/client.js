// Default base URL for production: '/api'
// Can be overridden with VITE_API_BASE_URL environment variable
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function createClient(getToken) {
  async function request(path, opts = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    
    // Fallback logic:
    // - If full URL is passed (e.g., http://localhost:4000) → keep it as is
    // - If path only (e.g., /api) → prefix with BASE
    let apiPath;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Full URL provided, use as-is
      apiPath = path;
    } else if (BASE.startsWith('http://') || BASE.startsWith('https://')) {
      // BASE is a full URL, append /api/v1
      apiPath = `${BASE}/api/v1${path}`;
    } else {
      // BASE is a path (e.g., /api), append /v1
      apiPath = `${BASE}/v1${path}`;
    }
    
    const res = await fetch(apiPath, { ...opts, headers });
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

