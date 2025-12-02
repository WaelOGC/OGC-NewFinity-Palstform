#!/usr/bin/env node

/**
 * Auto-Build Script for Frontend (CommonJS version)
 * 
 * Watches for file changes in frontend/src and automatically:
 * - Runs npm install (if package.json changes)
 * - Runs npm run build
 * 
 * Usage: node scripts/watch-and-build.cjs
 */

const { watch } = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { resolve, dirname } = require('path');

const execAsync = promisify(exec);
const __dirname = dirname(__filename || require.resolve('./watch-and-build.cjs'));

const PROJECT_ROOT = resolve(__dirname, '..');
const FRONTEND_DIR = resolve(PROJECT_ROOT, 'frontend');
const FRONTEND_SRC = resolve(FRONTEND_DIR, 'src');
const PACKAGE_JSON = resolve(FRONTEND_DIR, 'package.json');

let buildTimeout = null;
let isBuilding = false;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      if (error) {
        log(`Error: ${error.message}`, colors.red);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function build() {
  if (isBuilding) {
    log('Build already in progress, skipping...', colors.yellow);
    return;
  }

  isBuilding = true;
  log('🔄 Starting build process...', colors.cyan);

  log('🏗️  Building frontend...', colors.yellow);
  const buildSuccess = await runCommand('npm run build', FRONTEND_DIR);

  if (buildSuccess) {
    log('✅ Build completed successfully!', colors.green);
  } else {
    log('❌ Build failed!', colors.red);
  }

  isBuilding = false;
}

function debounceBuild() {
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }

  buildTimeout = setTimeout(() => {
    build();
  }, 1000); // Wait 1 second after last change
}

log('👀 Watching for file changes...', colors.blue);
log(`📁 Watching: ${FRONTEND_SRC}`, colors.cyan);
log('Press Ctrl+C to stop', colors.yellow);
log('');

// Initial build
build();

// Watch frontend/src directory
watch(FRONTEND_SRC, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Ignore node_modules and dist
  if (filename.includes('node_modules') || filename.includes('dist')) {
    return;
  }

  log(`📝 File changed: ${filename}`, colors.cyan);
  debounceBuild();
});

// Watch package.json
watch(PACKAGE_JSON, (eventType) => {
  if (eventType === 'change') {
    log('📦 package.json changed, will reinstall dependencies on next build', colors.yellow);
    debounceBuild();
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Stopping file watcher...', colors.yellow);
  process.exit(0);
});

