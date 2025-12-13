#!/usr/bin/env node
/**
 * Cross-platform port freeing script
 * Usage: node scripts/free-port.js <PORT>
 * 
 * Kills processes using the specified port on Windows, macOS, and Linux
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = process.argv[2];

if (!PORT) {
  console.error('Error: Port number required');
  console.error('Usage: node scripts/free-port.js <PORT>');
  process.exit(1);
}

const portNum = parseInt(PORT, 10);
if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
  console.error(`Error: Invalid port number: ${PORT}`);
  process.exit(1);
}

const platform = process.platform;

async function freePortWindows(port) {
  try {
    // Find PIDs using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout || stdout.trim().length === 0) {
      console.log(`[FreePort] Port ${port} is not in use.`);
      return;
    }

    // Extract PIDs from netstat output
    // Format: TCP    0.0.0.0:4000    0.0.0.0:0    LISTENING    12345
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    }

    if (pids.size === 0) {
      console.log(`[FreePort] Port ${port} is not in use.`);
      return;
    }

    // Kill each PID
    const killedPids = [];
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /PID ${pid} /F`);
        killedPids.push(pid);
        console.log(`[FreePort] Killed process ${pid} using port ${port}`);
      } catch (err) {
        // Process might already be gone or we don't have permission
        console.warn(`[FreePort] Could not kill process ${pid}: ${err.message}`);
      }
    }

    if (killedPids.length > 0) {
      console.log(`[FreePort] ✅ Freed port ${port} (killed ${killedPids.length} process${killedPids.length > 1 ? 'es' : ''})`);
    }
  } catch (err) {
    // If netstat returns no results, the port is free
    if (err.code === 1 && err.stderr.includes('findstr')) {
      console.log(`[FreePort] Port ${port} is not in use.`);
      return;
    }
    throw err;
  }
}

async function freePortUnix(port) {
  try {
    // Find PIDs using the port
    const { stdout } = await execAsync(`lsof -ti :${port}`);
    
    if (!stdout || stdout.trim().length === 0) {
      console.log(`[FreePort] Port ${port} is not in use.`);
      return;
    }

    // Extract PIDs
    const pids = stdout.trim().split('\n').filter(pid => pid && !isNaN(pid));
    
    if (pids.length === 0) {
      console.log(`[FreePort] Port ${port} is not in use.`);
      return;
    }

    // Kill each PID
    const killedPids = [];
    for (const pid of pids) {
      try {
        await execAsync(`kill -9 ${pid}`);
        killedPids.push(pid);
        console.log(`[FreePort] Killed process ${pid} using port ${port}`);
      } catch (err) {
        // Process might already be gone or we don't have permission
        console.warn(`[FreePort] Could not kill process ${pid}: ${err.message}`);
      }
    }

    if (killedPids.length > 0) {
      console.log(`[FreePort] ✅ Freed port ${port} (killed ${killedPids.length} process${killedPids.length > 1 ? 'es' : ''})`);
    }
  } catch (err) {
    // If lsof returns no results, the port is free
    if (err.code === 1 && err.stderr.includes('lsof')) {
      console.log(`[FreePort] Port ${port} is not in use.`);
      return;
    }
    throw err;
  }
}

// Main execution
(async () => {
  try {
    if (platform === 'win32') {
      await freePortWindows(portNum);
    } else {
      await freePortUnix(portNum);
    }
    process.exit(0);
  } catch (error) {
    console.error(`[FreePort] Error freeing port ${portNum}:`, error.message);
    process.exit(1);
  }
})();
