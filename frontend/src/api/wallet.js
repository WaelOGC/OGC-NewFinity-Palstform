import { createClient } from './client.js';

export function walletApi(getToken) {
  const client = createClient(getToken);

  async function summary() {
    return client.get('/wallet');
  }

  async function transactions(params) {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)])) : '';
    return client.get('/wallet/transactions' + q);
  }

  async function createDemoTransactions() {
    return client.post('/wallet/demo-transactions');
  }

  return { summary, transactions, createDemoTransactions };
}

