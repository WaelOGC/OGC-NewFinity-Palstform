/**
 * Comprehensive Wallet API System Verification
 * This script verifies all aspects of the wallet system
 */

import 'dotenv/config';
import pool from './src/db.js';

const results = {
  checks: [],
  errors: [],
  warnings: []
};

function logCheck(name, passed, details = '') {
  results.checks.push({ name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
}

function logError(name, error) {
  results.errors.push({ name, error });
  console.log(`❌ ${name}: ${error}`);
}

function logWarning(name, message) {
  results.warnings.push({ name, message });
  console.log(`⚠️  ${name}: ${message}`);
}

// Check 1: Environment Variables
async function checkEnvironment() {
  console.log('\n📋 1️⃣ Backend Environment Validation\n');
  
  const required = [
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'
  ];
  
  const optional = [
    'JWT_ACCESS_EXPIRES_IN', 'JWT_REFRESH_EXPIRES_IN',
    'JWT_COOKIE_ACCESS_NAME', 'JWT_COOKIE_REFRESH_NAME'
  ];
  
  let allPresent = true;
  
  for (const key of required) {
    const value = process.env[key];
    if (value) {
      logCheck(`${key} is set`, true, value.length > 0 ? '✓' : 'empty');
    } else {
      logCheck(`${key} is set`, false, 'MISSING');
      allPresent = false;
    }
  }
  
  for (const key of optional) {
    const value = process.env[key];
    if (value) {
      logCheck(`${key} is set`, true, value);
    } else {
      logWarning(`${key} not set`, 'Using default value');
    }
  }
  
  const dbName = process.env.DB_NAME;
  logCheck('DB_NAME matches expected', dbName === 'ogc_newfinity', 
    `Expected: ogc_newfinity, Got: ${dbName || 'not set'}`);
  
  return allPresent;
}

// Check 2: Database Connection
async function checkDatabaseConnection() {
  console.log('\n📋 2️⃣ Database Connection Test\n');
  
  try {
    const [rows] = await pool.query('SELECT 1 AS test');
    logCheck('Database connection', true, 'Connected successfully');
    return true;
  } catch (error) {
    logError('Database connection', error.message);
    return false;
  }
}

// Check 3: Database Tables
async function checkDatabaseTables() {
  console.log('\n📋 3️⃣ Database Tables Verification\n');
  
  try {
    // Check User table
    try {
      const [userRows] = await pool.query('SHOW TABLES LIKE "User"');
      logCheck('User table exists', userRows.length > 0, 
        userRows.length > 0 ? 'Found' : 'Not found');
    } catch (error) {
      logCheck('User table exists', false, error.message);
    }
    
    // Check wallets table
    try {
      const [walletRows] = await pool.query('SHOW TABLES LIKE "wallets"');
      logCheck('wallets table exists', walletRows.length > 0,
        walletRows.length > 0 ? 'Found' : 'Not found');
    } catch (error) {
      logCheck('wallets table exists', false, error.message);
    }
    
    // Check transactions table
    try {
      const [txRows] = await pool.query('SHOW TABLES LIKE "transactions"');
      logCheck('transactions table exists', txRows.length > 0,
        txRows.length > 0 ? 'Found' : 'Not found');
    } catch (error) {
      logCheck('transactions table exists', false, error.message);
    }
    
    // Check wallet schema
    try {
      const [walletSchema] = await pool.query('DESCRIBE wallets');
      const columns = walletSchema.map(row => row.Field);
      const required = ['id', 'user_id', 'balance', 'staked', 'rewards', 'address'];
      const missing = required.filter(col => !columns.includes(col));
      logCheck('wallets table schema', missing.length === 0,
        missing.length === 0 ? 'All required columns present' : `Missing: ${missing.join(', ')}`);
    } catch (error) {
      logCheck('wallets table schema', false, error.message);
    }
    
    // Check transactions schema
    try {
      const [txSchema] = await pool.query('DESCRIBE transactions');
      const columns = txSchema.map(row => row.Field);
      const required = ['id', 'wallet_id', 'user_id', 'type', 'amount', 'status'];
      const missing = required.filter(col => !columns.includes(col));
      logCheck('transactions table schema', missing.length === 0,
        missing.length === 0 ? 'All required columns present' : `Missing: ${missing.join(', ')}`);
    } catch (error) {
      logCheck('transactions table schema', false, error.message);
    }
    
    return true;
  } catch (error) {
    logError('Database tables check', error.message);
    return false;
  }
}

// Check 4: Backend Server Status
async function checkBackendServer() {
  console.log('\n📋 4️⃣ Backend Server Status\n');
  
  try {
    // Check primary health endpoint on port 4000
    const healthUrl = 'http://localhost:4000/health';
    const response = await fetch(healthUrl);
    const ok = response.ok && response.status === 200;
    const data = await response.json().catch(() => ({}));
    
    logCheck('Backend server running', ok, `Status: ${response.status}`);
    
    if (ok && data.status === 'ok') {
      logCheck('Health endpoint response', true, 'Returns correct status');
    } else {
      logCheck('Health endpoint response', false, 'Unexpected response format');
    }
    
    // Also check API health endpoint
    try {
      const apiHealthUrl = 'http://localhost:4000/api/v1/health';
      const apiResponse = await fetch(apiHealthUrl);
      const apiOk = apiResponse.ok && apiResponse.status === 200;
      logCheck('API health endpoint', apiOk, `Status: ${apiResponse.status}`);
    } catch (apiError) {
      logWarning('API health endpoint', 'Could not reach /api/v1/health');
    }
    
    return ok;
  } catch (error) {
    logCheck('Backend server running', false, error.message);
    logWarning('Backend server', 'Make sure to run: npm start');
    return false;
  }
}

// Main verification function
async function runVerification() {
  console.log('🚀 Wallet API System Verification');
  console.log('='.repeat(60));
  
  // Check 1: Environment
  const envOk = await checkEnvironment();
  
  // Check 2: Database Connection
  const dbOk = await checkDatabaseConnection();
  
  // Check 3: Database Tables
  if (dbOk) {
    await checkDatabaseTables();
  }
  
  // Check 4: Backend Server
  await checkBackendServer();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.checks.filter(c => c.passed).length;
  const failed = results.checks.filter(c => !c.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Checks:');
    results.checks.filter(c => !c.passed).forEach(check => {
      console.log(`   - ${check.name}: ${check.details}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => {
      console.log(`   - ${w.name}: ${w.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0) {
    console.log('🎉 All checks passed! Ready for API testing.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start backend: npm start');
    console.log('   2. Run API tests: npm run test:wallet');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
  }
  
  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
}

// Run verification
runVerification().catch(error => {
  console.error('💥 Verification error:', error);
  process.exit(1);
});

