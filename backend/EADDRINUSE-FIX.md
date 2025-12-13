# EADDRINUSE Error Fix

## What This Error Means

The error `EADDRINUSE: address already in use 0.0.0.0:4000` means that port 4000 is already being used by another process (usually a previous instance of the backend server that didn't shut down properly).

## Quick Fix

**Use this command to start the backend (automatically frees the port):**

```bash
npm run dev:clean
```

This command will:
1. Automatically kill any process using port 4000
2. Start the backend server with nodemon

## Manual Port Freeing

If you need to free the port manually without starting the server:

```bash
npm run free:4000
```

## Production Start

For production, use:

```bash
npm run start:clean
```

This will free port 4000 and start the server in production mode.

## How It Works

The `free-port.js` script:
- **Windows**: Uses `netstat` and `taskkill` to find and kill processes
- **macOS/Linux**: Uses `lsof` and `kill` to find and kill processes
- Only targets the specified port (safe)
- Prints clear messages about what was killed

## Prevention

Always use `npm run dev:clean` instead of `npm run dev` to avoid this error. The `:clean` variant automatically frees the port before starting.

## Troubleshooting

If `npm run dev:clean` still fails:
1. Check if another application is using port 4000
2. Manually run `npm run free:4000` and check the output
3. On Windows, you may need to run PowerShell/CMD as Administrator
4. On macOS/Linux, you may need `sudo` if the process belongs to another user
