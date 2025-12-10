/**
 * Wallet API Verification Test Script
 * Tests all wallet endpoints as specified in the verification checklist
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Using built-in fetch (Node 18+)

// Try port 4000 first (index.js with wallet routes), fallback to 3000
const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test user credentials
const TEST_USER = {
  email: 'wallet_test@ogc.com',
  password: 'Test1234!',
  fullName: 'Wallet Test User'
};

let accessToken = null;
let cookies = {};

// Helper to make authenticated requests
async function apiCall(method, endpoint, body = null, useAuth = true) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (useAuth && accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Include cookies if available
  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  if (cookieString) {
    options.headers['Cookie'] = cookieString;
  }

  try {
    const response = await fetch(url, options);
    const responseCookies = response.headers.get('set-cookie');
    if (responseCookies) {
      // Parse cookies (simplified)
      responseCookies.split(',').forEach(cookie => {
        const parts = cookie.split(';')[0].trim().split('=');
        if (parts.length === 2) {
          cookies[parts[0]] = parts[1];
        }
      });
    }

    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      ok: false
    };
  }
}

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, passed, message = '') {
  if (passed) {
    results.passed.push(name);
    console.log(`✅ ${name}${message ? ': ' + message : ''}`);
  } else {
    results.failed.push(name);
    console.log(`❌ ${name}${message ? ': ' + message : ''}`);
  }
}

function logWarning(name, message) {
  results.warnings.push(`${name}: ${message}`);
  console.log(`⚠️  ${name}: ${message}`);
}

// Test 1: Backend Health Check
async function testBackendHealth() {
  console.log('\n📋 Test 1: Backend Health Check');
  const HEALTH_URL = `${BASE_URL}/health`;
  console.log(`  📄 Checking: ${HEALTH_URL}`);
  
  try {
    const response = await fetch(HEALTH_URL);
    const data = await response.json().catch(() => ({}));
    
    console.log(`  📄 Backend Health Check: Status: ${response.status}`);
    
    if (response.status !== 200) {
      throw new Error(`Unexpected status ${response.status} from ${HEALTH_URL}`);
    }
    
    logTest('Backend Health Check', true, `Status: ${response.status}`);
    return true;
  } catch (err) {
    logTest('Backend Health Check', false, `Error: ${err.message}`);
    return false;
  }
}

// Test 2: User Registration
async function testUserRegistration() {
  console.log('\n📋 Test 2: User Registration');
  const result = await apiCall('POST', '/auth/register', {
    email: TEST_USER.email,
    password: TEST_USER.password,
    fullName: TEST_USER.fullName
  }, false);

  if (result.status === 201 || result.status === 200) {
    logTest('User Registration', true, `Status: ${result.status}`);
    if (result.data.access) {
      accessToken = result.data.access;
    }
    return true;
  } else if (result.status === 400 && result.data.error?.includes('already')) {
    logWarning('User Registration', 'User already exists, will try login instead');
    return false; // User exists, try login
  } else if (result.status === 409 || (result.data.error && result.data.error.includes('already'))) {
    logWarning('User Registration', 'User already exists, will try login instead');
    return false; // User exists, try login
  } else {
    console.log(`   Full error response: ${JSON.stringify(result.data, null, 2)}`);
    logTest('User Registration', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 3: User Login
async function testUserLogin() {
  console.log('\n📋 Test 3: User Login');
  const result = await apiCall('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  }, false);

  if (result.status === 200) {
    logTest('User Login', true, `Status: ${result.status}`);
    if (result.data.access) {
      accessToken = result.data.access;
    }
    // Check for cookies
    const hasAccessCookie = cookies['ogc_access'] || result.headers['set-cookie']?.includes('ogc_access');
    const hasRefreshCookie = cookies['ogc_refresh'] || result.headers['set-cookie']?.includes('ogc_refresh');
    logTest('Access Cookie Set', hasAccessCookie, hasAccessCookie ? 'Cookie found' : 'Cookie not found');
    logTest('Refresh Cookie Set', hasRefreshCookie, hasRefreshCookie ? 'Cookie found' : 'Cookie not found');
    return true;
  } else {
    console.log(`   Full error response: ${JSON.stringify(result.data, null, 2)}`);
    logTest('User Login', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 4: Wallet Summary
async function testWalletSummary() {
  console.log('\n📋 Test 4: Wallet Summary');
  const result = await apiCall('GET', '/wallet');

  if (result.status === 200) {
    const requiredFields = ['balance', 'staked', 'rewards', 'address', 'updatedAt'];
    const hasAllFields = requiredFields.every(field => result.data.hasOwnProperty(field));
    logTest('Wallet Summary', hasAllFields, `Status: ${result.status}`);
    if (hasAllFields) {
      console.log(`   Balance: ${result.data.balance}, Staked: ${result.data.staked}, Rewards: ${result.data.rewards}`);
    } else {
      console.log(`   Missing fields. Got: ${Object.keys(result.data).join(', ')}`);
    }
    return hasAllFields;
  } else {
    logTest('Wallet Summary', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 5: Demo Transactions
async function testDemoTransactions() {
  console.log('\n📋 Test 5: Demo Transactions Creation');
  const result = await apiCall('POST', '/wallet/demo-transactions');

  if (result.status === 200 && result.data.ok === true) {
    logTest('Demo Transactions', true, `Status: ${result.status}, Inserted: ${result.data.inserted || 5}`);
    return true;
  } else {
    logTest('Demo Transactions', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 6: List Transactions
async function testListTransactions() {
  console.log('\n📋 Test 6: List Transactions');
  const result = await apiCall('GET', '/wallet/transactions?page=1&pageSize=20');

  if (result.status === 200) {
    const hasItems = Array.isArray(result.data.items);
    const hasPagination = typeof result.data.total === 'number' && 
                          typeof result.data.page === 'number' && 
                          typeof result.data.pageSize === 'number';
    const itemCount = hasItems ? result.data.items.length : 0;
    logTest('List Transactions', hasItems && hasPagination, 
      `Status: ${result.status}, Items: ${itemCount}, Total: ${result.data.total}`);
    return hasItems && hasPagination;
  } else {
    logTest('List Transactions', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 7: Stake
async function testStake() {
  console.log('\n📋 Test 7: Stake Operation');
  const result = await apiCall('POST', '/wallet/stake', { amount: 1000 });

  if (result.status === 200 && result.data.success === true) {
    logTest('Stake Operation', true, `Status: ${result.status}`);
    return true;
  } else {
    logTest('Stake Operation', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 8: Unstake
async function testUnstake() {
  console.log('\n📋 Test 8: Unstake Operation');
  const result = await apiCall('POST', '/wallet/unstake', { amount: 500 });

  if (result.status === 200 && result.data.success === true) {
    logTest('Unstake Operation', true, `Status: ${result.status}`);
    return true;
  } else {
    logTest('Unstake Operation', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 9: Transfer
async function testTransfer() {
  console.log('\n📋 Test 9: Transfer Operation');
  const result = await apiCall('POST', '/wallet/transfer', {
    to: '0x1234567890abcdef',
    amount: 250
  });

  if (result.status === 200) {
    const hasTxId = result.data.txId !== undefined || result.data.tx_id !== undefined;
    logTest('Transfer Operation', hasTxId, `Status: ${result.status}, TX ID: ${result.data.txId || result.data.tx_id}`);
    return hasTxId;
  } else {
    logTest('Transfer Operation', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 10: Verify Wallet Balance After Operations
async function testWalletBalanceAfterOps() {
  console.log('\n📋 Test 10: Wallet Balance Verification');
  const result = await apiCall('GET', '/wallet');

  if (result.status === 200) {
    console.log(`   Final Balance: ${result.data.balance}`);
    console.log(`   Final Staked: ${result.data.staked}`);
    console.log(`   Final Rewards: ${result.data.rewards}`);
    logTest('Wallet Balance Verification', true, 'Balance retrieved successfully');
    return true;
  } else {
    logTest('Wallet Balance Verification', false, `Status: ${result.status}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Wallet API Verification Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API Base: ${API_BASE}\n`);

  // Test 1: Health check
  const healthOk = await testBackendHealth();
  if (!healthOk) {
    console.log('\n❌ Backend health check failed. Please check the backend is running and accessible.');
    process.exit(1);
  }

  // Test 2 & 3: Auth
  const registered = await testUserRegistration();
  if (!registered) {
    await testUserLogin();
  }

  if (!accessToken) {
    console.log('\n❌ Authentication failed. Cannot proceed with wallet tests.');
    process.exit(1);
  }

  // Test 4: Wallet Summary
  await testWalletSummary();

  // Test 5: Demo Transactions
  await testDemoTransactions();

  // Test 6: List Transactions
  await testListTransactions();

  // Test 7: Stake
  await testStake();

  // Test 8: Unstake
  await testUnstake();

  // Test 9: Transfer
  await testTransfer();

  // Test 10: Final Balance Check
  await testWalletBalanceAfterOps();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner error:', error);
  process.exit(1);
});

