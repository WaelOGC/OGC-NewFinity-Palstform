# Frontend Deployment (Production)

This document describes the steps to build and deploy the OGC NewFinity frontend for production on the VPS.

## Prerequisites

- Node.js and npm installed on the VPS
- Git repository cloned at `/var/www/ogc-platform`
- Nginx configured to serve static files from `/var/www/ogc-platform/frontend/dist`
- Nginx configured to proxy `/api/*` requests to the backend on port 4000

## Build Configuration

The frontend is built using Vite and configured for production:

- **Base path**: `/` (served at root domain)
- **API Base URL**: `/api` (default, can be overridden with `VITE_API_BASE_URL` environment variable)
- **Build output**: `frontend/dist/`

## Deployment Steps

### 1. Build Locally (Optional)

If you want to build the frontend before pushing to the VPS:

```bash
cd frontend
npm install
npm run build
```

The build output will be in `frontend/dist/`.

### 2. VPS Deployment via Git

On the VPS, follow these steps:

```bash
# Navigate to the project root
cd /var/www/ogc-platform

# Pull latest changes from the repository
git pull origin main

# Navigate to frontend directory
cd frontend

# Install dependencies (including dev dependencies needed for build)
npm install --production=false

# Build the frontend for production
npm run build
```

The build output will be generated at:
```
/var/www/ogc-platform/frontend/dist
```

### 3. Nginx Configuration

Nginx should be configured to:

1. **Serve static files** from `/var/www/ogc-platform/frontend/dist`:
   ```nginx
   root /var/www/ogc-platform/frontend/dist;
   ```

2. **Proxy API requests** to the backend:
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:4000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

3. **Handle SPA routing** (serve index.html for all routes):
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

### 4. Restart Nginx (if configuration changed)

If you modified Nginx configuration:

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload Nginx
```

## Environment Variables

The frontend uses the following environment variable:

- `VITE_API_BASE_URL`: Base URL for API calls (default: `/api`)

To override the API base URL, create a `.env` file in the `frontend/` directory:

```bash
cd /var/www/ogc-platform/frontend
echo "VITE_API_BASE_URL=/api" > .env
npm run build
```

**Note**: Environment variables must be set at build time. They are baked into the build output and cannot be changed at runtime without rebuilding.

## Build Scripts

Available npm scripts:

- `npm run dev` - Start development server (localhost:5173)
- `npm run build` - Build for production (output: `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run linter (placeholder, to be configured)

## Verification

After deployment, verify the frontend is working:

1. **Check static files are served**:
   ```bash
   curl https://finityplatform.cloud/
   ```
   Should return the HTML page.

2. **Check API endpoints**:
   ```bash
   curl https://finityplatform.cloud/api/status
   curl https://finityplatform.cloud/api/health
   ```
   Should return JSON responses.

3. **Check frontend in browser**:
   - Navigate to `https://finityplatform.cloud/`
   - The landing page should load correctly
   - Check browser console for any errors
   - Verify the SystemStatusBadge component shows backend status

## Troubleshooting

### Build fails

- Check Node.js version (should be compatible with package.json)
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check disk space: `df -h`

### Frontend not loading

- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify dist folder exists: `ls -la /var/www/ogc-platform/frontend/dist`
- Check file permissions: `ls -la /var/www/ogc-platform/frontend/dist/index.html`

### API calls failing

- Verify backend is running: `pm2 status ogc-backend`
- Check backend logs: `pm2 logs ogc-backend`
- Test backend directly: `curl http://127.0.0.1:4000/status`
- Verify Nginx proxy configuration

## PM2 Usage Notes

The frontend is served as static files by Nginx, so PM2 is **not required** for the frontend itself. However, the backend runs under PM2.

### Backend PM2 Management

The backend should be managed with PM2:

```bash
# Check backend status
pm2 status ogc-backend

# View backend logs
pm2 logs ogc-backend

# Restart backend
pm2 restart ogc-backend

# Stop backend
pm2 stop ogc-backend

# Start backend
pm2 start ogc-backend
```

### Frontend Deployment Workflow

Since the frontend is static files served by Nginx:

1. **No PM2 process needed** for frontend
2. **Rebuild after code changes**: `cd frontend && npm run build`
3. **Nginx automatically serves** the new build from `/var/www/ogc-platform/frontend/dist`
4. **No restart required** - Nginx serves files directly from disk

## Maintenance

- After pulling new changes, always rebuild: `cd frontend && npm run build`
- Keep dependencies updated: `npm audit` and `npm update`
- Monitor build output size to catch unexpected bundle bloat
- The frontend build is static and does not require a process manager like PM2

