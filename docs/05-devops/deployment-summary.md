# Auto-Deployment System - Summary

## ✅ What Has Been Created

### 1. **Auto-Build System**
- **`scripts/watch-and-build.cjs`** - Watches `frontend/src` for changes and auto-builds
- **`scripts/watch-and-build.js`** - ES module version (alternative)
- Automatically runs `npm run build` when files change
- Debounced to avoid excessive builds

### 2. **Auto-Deploy Scripts**
- **`scripts/auto-deploy-frontend.sh`** - Bash script for Linux/Mac
  - `build` - Build frontend once
  - `deploy` - Deploy to VPS via rsync
  - `watch` - Watch mode (build + deploy on changes)
- **`scripts/quick-deploy.ps1`** - PowerShell script for Windows
  - Quick deploy with build + rsync/scp

### 3. **Routing Updates**
- **`frontend/src/main.jsx`** - Updated with:
  - Public routes: `/` and `/coming-soon` (Coming Soon page)
  - Internal routes: `/internal/*` (all dev pages)
  - Legacy route redirects for backward compatibility

### 4. **Route Protection**
- **`frontend/src/components/InternalRouteGuard.jsx`** - Simple token guard
  - Checks for `?key=DEV1234` query parameter
  - Redirects to Coming Soon if key is missing/incorrect
  - Client-side only (lightweight, not secure)

### 5. **Nginx Configuration**
- **`nginx-finityplatform.cloud.conf`** - Updated with:
  - Public route handling (`/` and `/coming-soon`)
  - Internal route handling (`/internal/*`)
  - Proper SPA fallback for React Router

### 6. **Documentation**
- **`AUTO-DEPLOYMENT-GUIDE.md`** - Complete usage guide
- **`DEPLOYMENT-SUMMARY.md`** - This file

## 🚀 Quick Start

### For Development (Auto-Build + Deploy)
```bash
# Linux/Mac
chmod +x scripts/auto-deploy-frontend.sh
./scripts/auto-deploy-frontend.sh watch

# Windows (PowerShell)
.\scripts\quick-deploy.ps1 -ReloadNginx
```

### For Manual Deployment
```bash
# Build
cd frontend && npm run build

# Deploy
./scripts/auto-deploy-frontend.sh deploy
```

### Using npm Scripts
```bash
cd frontend
npm run watch        # Auto-build on changes
npm run deploy       # Deploy to VPS
npm run deploy:watch # Watch + deploy
```

## 📍 URL Structure

### Public (No Key Required)
- `https://finityplatform.cloud/` → Coming Soon page
- `https://finityplatform.cloud/coming-soon` → Coming Soon page

### Internal (Requires `?key=DEV1234`)
- `https://finityplatform.cloud/internal/landing?key=DEV1234`
- `https://finityplatform.cloud/internal/login?key=DEV1234`
- `https://finityplatform.cloud/internal/wallet?key=DEV1234`
- `https://finityplatform.cloud/internal/download?key=DEV1234`
- `https://finityplatform.cloud/internal/contact?key=DEV1234`
- `https://finityplatform.cloud/internal/community?key=DEV1234`
- `https://finityplatform.cloud/internal/blog?key=DEV1234`
- `https://finityplatform.cloud/internal/blog/:slug?key=DEV1234`

## 🔧 Configuration

### Environment Variables
```bash
export VPS_USER="root"
export VPS_HOST="finityplatform.cloud"
export VPS_PATH="/var/www/ogc-platform/frontend/dist"
export SSH_KEY="~/.ssh/id_rsa"
export RELOAD_NGINX="true"
```

### Changing the Dev Key
Edit `frontend/src/components/InternalRouteGuard.jsx`:
```javascript
const INTERNAL_DEV_KEY = 'YOUR_NEW_KEY';
```

## 📋 Deployment Checklist

1. ✅ Update Nginx config on VPS
2. ✅ Set environment variables
3. ✅ Test SSH access to VPS
4. ✅ Run initial build: `cd frontend && npm run build`
5. ✅ Test deployment: `./scripts/auto-deploy-frontend.sh deploy`
6. ✅ Verify public page: `https://finityplatform.cloud/`
7. ✅ Verify internal page: `https://finityplatform.cloud/internal/landing?key=DEV1234`

## ⚠️ Important Notes

1. **Token Protection is NOT Secure**
   - Client-side only
   - Suitable for dev/preview only
   - Use proper auth for production

2. **Coming Soon Page is Public**
   - Root URL (`/`) serves Coming Soon
   - No protection needed
   - All other pages are internal

3. **Legacy Routes Redirect**
   - Old routes (`/landing`, `/login`, etc.) redirect to `/internal/*`
   - Maintains backward compatibility
   - Can be removed later

4. **Build Output**
   - Always builds to `frontend/dist/`
   - Nginx serves from `/var/www/ogc-platform/frontend/dist` on VPS
   - Ensure paths match

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version
- Clear `node_modules`: `rm -rf frontend/node_modules && cd frontend && npm install`
- Check disk space

### Deployment Fails
- Verify SSH access
- Check rsync is installed
- Verify VPS path exists
- Check file permissions

### Internal Routes Not Working
- Ensure `/internal/` prefix
- Check `?key=DEV1234` in URL
- Verify React Router is working
- Check browser console

### Nginx Issues
- Test config: `sudo nginx -t`
- Check logs: `sudo tail -f /var/log/nginx/finityplatform.cloud.error.log`
- Verify dist folder exists

## 📚 Next Steps

1. Set up SSH keys for passwordless access
2. Configure environment variables
3. Test the deployment
4. Update dev key if needed
5. Start using watch mode for development

For detailed instructions, see `AUTO-DEPLOYMENT-GUIDE.md`.

