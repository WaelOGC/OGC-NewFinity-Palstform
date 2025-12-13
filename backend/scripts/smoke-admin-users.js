#!/usr/bin/env node

/**
 * Smoke Test for Admin Users API
 * 
 * Quick sanity check for admin users endpoints.
 * Tests:
 * - GET /api/v1/admin/users (list users)
 * - GET /api/v1/admin/users/:userId (user details)
 * 
 * Usage:
 *   node backend/scripts/smoke-admin-users.js
 * 
 * Requires: Backend must be running and schema resolver initialized
 * 
 * Environment variables:
 *   API_BASE_URL - Base URL for API (default: http://localhost:5000)
 *   ADMIN_AUTH_TOKEN - Admin authentication token (if needed)
 * 
 * Note: This script requires admin authentication.
 * You may need to:
 * 1. Log in as admin user via /api/v1/auth/login
 * 2. Copy the session cookie or bearer token
 * 3. Set ADMIN_AUTH_TOKEN environment variable or modify script
 * 
 * Alternative: Use Postman/curl with proper authentication
 * 
 * Example curl commands:
 *   # List users
 *   curl -X GET "http://localhost:5000/api/v1/admin/users?page=1&limit=10" \
 *        -H "Cookie: your-session-cookie" \
 *        -H "Content-Type: application/json"
 * 
 *   # Get user details
 *   curl -X GET "http://localhost:5000/api/v1/admin/users/1" \
 *        -H "Cookie: your-session-cookie" \
 *        -H "Content-Type: application/json"
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || '';

// Schema resolver functions (loaded lazily)
let resolveUserSchema = null;
let getUserSchema = null;
let schemaResolverLoaded = false;

async function loadSchemaResolver() {
  if (schemaResolverLoaded) return;
  schemaResolverLoaded = true;
  
  try {
    // Use dynamic import to handle ES modules
    const schemaResolver = await import('../src/utils/userSchemaResolver.js');
    resolveUserSchema = schemaResolver.resolveUserSchema;
    getUserSchema = schemaResolver.getUserSchema;
  } catch (err) {
    // Schema resolver not available - will show schema info from API response instead
    resolveUserSchema = null;
    getUserSchema = null;
  }
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function showSchemaInfo() {
  await loadSchemaResolver();
  
  if (resolveUserSchema && getUserSchema) {
    try {
      // Resolve schema if not already cached
      await resolveUserSchema();
      const schema = getUserSchema();
      
      if (schema) {
        const cols = schema.columns;
        const lastLogin = cols.lastLogin || 'not found';
        const status = cols.status || 'not found';
        const role = cols.role || 'not found';
        log(`schema: table=${schema.table} lastLogin=${lastLogin} status=${status} role=${role}`, 'blue');
      } else {
        log(`schema: not resolved`, 'yellow');
      }
    } catch (err) {
      log(`schema: error - ${err.message}`, 'yellow');
    }
  } else {
    log(`schema: resolver not available (infer from API response)`, 'yellow');
  }
}

async function makeRequest(method, path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if provided
  if (ADMIN_AUTH_TOKEN) {
    if (ADMIN_AUTH_TOKEN.startsWith('Bearer ')) {
      headers['Authorization'] = ADMIN_AUTH_TOKEN;
    } else {
      headers['Cookie'] = ADMIN_AUTH_TOKEN;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      ...options,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

async function testListUsers() {
  log('\n=== Testing GET /api/v1/admin/users ===', 'blue');
  
  const result = await makeRequest('GET', '/api/v1/admin/users?page=1&limit=5');
  
  if (result.error) {
    log(`❌ Request failed: ${result.error}`, 'red');
    return false;
  }

  log(`Status: ${result.status} ${result.statusText}`, result.status === 200 ? 'green' : 'red');
  log(`X-Request-Id: ${result.headers['x-request-id'] || 'not present'}`, 'yellow');
  log(`X-Admin-Mode: ${result.headers['x-admin-mode'] || 'not present'}`, 'yellow');

  if (result.data) {
    log(`Response status: ${result.data.status}`, result.data.status === 'OK' ? 'green' : 'red');
    log(`Response code: ${result.data.code || 'N/A'}`, 'yellow');
    log(`Response message: ${result.data.message || 'N/A'}`, 'yellow');
    
    if (result.data.data && result.data.data.users) {
      log(`Users returned: ${result.data.data.users.length}`, 'green');
      log(`Total users: ${result.data.data.total}`, 'green');
      log(`Page: ${result.data.data.page}, Limit: ${result.data.data.limit}`, 'yellow');
      
      // Show first user's lastLoginAt and roles if available
      if (result.data.data.users.length > 0) {
        const firstUser = result.data.data.users[0];
        const lastLoginAt = firstUser.lastLoginAt || 'Never';
        const roles = (firstUser.roles || []).length > 0 ? `[${firstUser.roles.join(', ')}]` : '[]';
        const status = firstUser.accountStatus || 'Unknown';
        log(`user[0]: lastLoginAt=${lastLoginAt} roles=${roles} status=${status}`, 'green');
      }
    }
  }

  const success = result.status === 200 && result.data?.status === 'OK';
  return success;
}

async function testUserDetails(userId = 1) {
  log(`\n=== Testing GET /api/v1/admin/users/${userId} ===`, 'blue');
  
  const result = await makeRequest('GET', `/api/v1/admin/users/${userId}`);
  
  if (result.error) {
    log(`❌ Request failed: ${result.error}`, 'red');
    return false;
  }

  log(`Status: ${result.status} ${result.statusText}`, result.status === 200 ? 'green' : 'yellow');
  log(`X-Request-Id: ${result.headers['x-request-id'] || 'not present'}`, 'yellow');
  log(`X-Admin-Mode: ${result.headers['x-admin-mode'] || 'not present'}`, 'yellow');

  if (result.data) {
    log(`Response status: ${result.data.status}`, result.data.status === 'OK' ? 'green' : 'red');
    log(`Response code: ${result.data.code || 'N/A'}`, 'yellow');
    log(`Response message: ${result.data.message || 'N/A'}`, 'yellow');
    
    if (result.data.data && result.data.data.user) {
      const user = result.data.data.user;
      log(`User ID: ${user.id}`, 'green');
      log(`Email: ${user.email || 'N/A'}`, 'green');
      log(`Display Name: ${user.displayName || 'N/A'}`, 'yellow');
      log(`Roles: [${(user.roles || []).join(', ') || 'none'}]`, 'yellow');
      log(`Account Status: ${user.accountStatus || 'Unknown'}`, 'yellow');
      log(`Last Login: ${user.lastLoginAt || 'Never'}`, 'yellow');
    }
  }

  // 200 or 404 are acceptable (404 means user doesn't exist, which is valid)
  const success = result.status === 200 || result.status === 404;
  return success;
}

async function testAdminNavigation() {
  log(`\n=== Testing GET /api/v1/admin/navigation ===`, 'blue');
  
  const result = await makeRequest('GET', '/api/v1/admin/navigation');
  
  if (result.error) {
    log(`❌ Request failed: ${result.error}`, 'red');
    return false;
  }

  log(`Status: ${result.status} ${result.statusText}`, result.status === 200 ? 'green' : 'red');
  log(`X-Request-Id: ${result.headers['x-request-id'] || 'not present'}`, 'yellow');
  log(`X-Admin-Mode: ${result.headers['x-admin-mode'] || 'not present'}`, 'yellow');

  if (result.data) {
    log(`Response status: ${result.data.status}`, result.data.status === 'OK' ? 'green' : 'red');
    log(`Response code: ${result.data.code || 'N/A'}`, 'yellow');
    log(`Response message: ${result.data.message || 'N/A'}`, 'yellow');
    
    if (result.data.data && result.data.data.groups) {
      const groups = result.data.data.groups;
      log(`Navigation groups: ${groups.length}`, 'green');
      log(`Show planned: ${result.data.data.meta?.showPlanned || false}`, 'yellow');
      
      if (groups.length > 0) {
        const firstGroup = groups[0];
        log(`First group: ${firstGroup.groupLabel} (${firstGroup.items.length} items)`, 'green');
        if (firstGroup.items.length > 0) {
          const firstItem = firstGroup.items[0];
          log(`First item: ${firstItem.label} -> ${firstItem.uiRoute}`, 'yellow');
        }
      }
    }
  }

  const success = result.status === 200 && result.data?.status === 'OK';
  return success;
}

async function runTests() {
  log('Admin Users API Smoke Test', 'blue');
  log('='.repeat(50), 'blue');
  log(`API Base URL: ${API_BASE_URL}`, 'yellow');
  log(`Auth Token: ${ADMIN_AUTH_TOKEN ? '***provided***' : 'not provided (may need to authenticate)'}`, 'yellow');
  
  // Show schema info if available
  await showSchemaInfo();

  if (!ADMIN_AUTH_TOKEN) {
    log('\n⚠️  WARNING: No authentication token provided.', 'yellow');
    log('   You may need to authenticate first.', 'yellow');
    log('   Set ADMIN_AUTH_TOKEN environment variable or modify script.', 'yellow');
    log('   For cookie-based auth: ADMIN_AUTH_TOKEN="connect.sid=..."', 'yellow');
    log('   For bearer token: ADMIN_AUTH_TOKEN="Bearer token_here"', 'yellow');
  }

  const results = {
    listUsers: false,
    userDetails: false,
    navigation: false,
  };

  // Test list users
  results.listUsers = await testListUsers();

  // Test user details (only if list worked)
  if (results.listUsers) {
    results.userDetails = await testUserDetails(1);
  } else {
    log('\n⏭️  Skipping user details test (list users failed)', 'yellow');
  }

  // Test navigation
  results.navigation = await testAdminNavigation();

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('Test Results Summary:', 'blue');
  log(`  List Users: ${results.listUsers ? '✅ PASS' : '❌ FAIL'}`, results.listUsers ? 'green' : 'red');
  log(`  User Details: ${results.userDetails ? '✅ PASS' : '❌ FAIL'}`, results.userDetails ? 'green' : 'red');
  log(`  Navigation: ${results.navigation ? '✅ PASS' : '❌ FAIL'}`, results.navigation ? 'green' : 'red');
  
  const allPassed = results.listUsers && results.userDetails && results.navigation;
  if (allPassed) {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Check output above.', 'red');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ (for native fetch support)', 'red');
  log('   Or install node-fetch: npm install node-fetch', 'yellow');
  process.exit(1);
}

runTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
