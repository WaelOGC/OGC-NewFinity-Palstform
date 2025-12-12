// Default base URL for production: '/api/v1'
// Can be overridden with VITE_API_BASE_URL environment variable
const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function createClient(getToken) {
  async function request(path, opts = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    
    // Fallback logic:
    // - If full URL is passed (e.g., https://finityplatform.cloud/api/v1) → keep it as is
    // - If path only (e.g., /auth/login) → prefix with BASE (which is already /api/v1)
    let apiPath;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Full URL provided, use as-is
      apiPath = path;
    } else if (BASE.startsWith('http://') || BASE.startsWith('https://')) {
      // BASE is a full URL, use it directly with path
      apiPath = `${BASE}${path}`;
    } else {
      // BASE is a path (e.g., /api/v1), append path directly
      apiPath = `${BASE}${path}`;
    }
    
    const res = await fetch(apiPath, { 
      ...opts, 
      headers,
      credentials: 'include', // Always include credentials for cookies
    });
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

