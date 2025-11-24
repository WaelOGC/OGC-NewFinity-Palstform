import { createClient } from './client.js';

export function authApi(getToken) {
  const client = createClient(getToken);

  async function login(email, password) {
    return client.post('/auth/login', { email, password });
  }

  async function logout() {
    return client.post('/auth/logout');
  }

  return { login, logout };
}

