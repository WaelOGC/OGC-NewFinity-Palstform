# Auto-Deployment System Guide

This guide explains how to use the automatic deployment system for the OGC NewFinity Platform frontend.

## Overview

The auto-deployment system provides:
- **Automatic builds** when files change in `frontend/src`
- **Automatic deployment** to VPS via rsync
- **Public/Private routing** - Coming Soon page is public, dev pages are internal
- **Simple token protection** for internal routes

## Architecture

### Public Routes (Accessible to Everyone)
- `https://finityplatform.cloud/` - Coming Soon page
- `https://finityplatform.cloud/coming-soon` - Coming Soon page (alias)

### Internal Routes (Require `?key=DEV1234`)
- `https://finityplatform.cloud/internal/landing?key=DEV1234`
- `https://finityplatform.cloud/internal/login?key=DEV1234`
- `https://finityplatform.cloud/internal/wallet?key=DEV1234`
- `https://finityplatform.cloud/internal/download?key=DEV1234`
- `https://finityplatform.cloud/internal/contact?key=DEV1234`
- `https://finityplatform.cloud/internal/community?key=DEV1234`
- `https://finityplatform.cloud/internal/blog?key=DEV1234`

## Setup Instructions

### 1. Local Development Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure VPS Connection
Set environment variables for VPS deployment:

```bash
export VPS_USER="root"
export VPS_HOST="finityplatform.cloud"
export VPS_PATH="/var/www/ogc-platform/frontend/dist"
export SSH_KEY="~/.ssh/id_rsa"
export RELOAD_NGINX="true"  # Optional: auto-reload Nginx after deploy
```

Or create a `.env.deploy` file in the project root:
```bash
VPS_USER=root
VPS_HOST=finityplatform.cloud
VPS_PATH=/var/www/ogc-platform/frontend/dist
SSH_KEY=~/.ssh/id_rsa
RELOAD_NGINX=true
```

### 2. VPS Setup

#### Update Nginx Configuration
Copy the updated Nginx config to your VPS:

```bash
# On VPS
sudo cp nginx-finityplatform.cloud.conf /etc/nginx/sites-available/finityplatform.cloud
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload Nginx
```

#### Verify Directory Structure
Ensure the deployment directory exists:
```bash
sudo mkdir -p /var/www/ogc-platform/frontend/dist
sudo chown -R $USER:$USER /var/www/ogc-platform/frontend/dist
```

### 3. Using Auto-Deployment

#### Option A: Watch Mode (Recommended for Development)
Automatically builds and deploys when files change:

```bash
# From project root
chmod +x scripts/auto-deploy-frontend.sh
./scripts/auto-deploy-frontend.sh watch
```

This will:
1. Watch `frontend/src` for changes
2. Automatically run `npm install` (if package.json changes)
3. Automatically run `npm run build`
4. Automatically sync `dist/` to VPS via rsync
5. Optionally reload Nginx

#### Option B: Manual Build and Deploy
Build and deploy manually:

```bash
# Build only
./scripts/auto-deploy-frontend.sh build

# Deploy only (after build)
./scripts/auto-deploy-frontend.sh deploy

# Build and deploy
./scripts/auto-deploy-frontend.sh build && ./scripts/auto-deploy-frontend.sh deploy
```

#### Option C: Using Node Watch Script Directly
For local development with auto-build (no deployment):

```bash
node scripts/watch-and-build.js
```

This watches for changes and builds automatically, but doesn't deploy to VPS.

## Internal Route Protection

### How It Works
- Internal routes are protected by the `InternalRouteGuard` component
- It checks for `?key=DEV1234` query parameter
- If key is missing or incorrect, redirects to Coming Soon page
- Protection is client-side only (lightweight, not secure - suitable for dev)

### Changing the Dev Key
Edit `frontend/src/components/InternalRouteGuard.jsx`:

```javascript
const INTERNAL_DEV_KEY = 'YOUR_NEW_KEY'; // Change this
```

### Accessing Internal Pages
Always include the key parameter:
```
https://finityplatform.cloud/internal/landing?key=DEV1234
```

## File Structure

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── InternalRouteGuard.jsx  # Token protection
│   │   ├── pages/
│   │   │   └── ComingSoonPage.jsx     # Public page
│   │   └── main.jsx                    # Updated routing
│   └── dist/                          # Build output
├── scripts/
│   ├── watch-and-build.js             # Auto-build watcher
│   └── auto-deploy-frontend.sh        # Auto-deploy script
└── nginx-finityplatform.cloud.conf    # Updated Nginx config
```

## Troubleshooting

### Build Fails
- Check Node.js version: `node --version`
- Clear node_modules: `rm -rf frontend/node_modules && cd frontend && npm install`
- Check disk space: `df -h`

### Deployment Fails
- Verify SSH access: `ssh -i ~/.ssh/id_rsa root@finityplatform.cloud`
- Check rsync is installed: `which rsync`
- Verify VPS path exists: `ssh root@finityplatform.cloud "ls -la /var/www/ogc-platform/frontend/dist"`

### Internal Routes Not Working
- Ensure you're using `/internal/` prefix
- Check you have `?key=DEV1234` in URL
- Verify React Router is handling the route correctly
- Check browser console for errors

### Nginx Issues
- Test config: `sudo nginx -t`
- Check error logs: `sudo tail -f /var/log/nginx/finityplatform.cloud.error.log`
- Verify dist folder: `ls -la /var/www/ogc-platform/frontend/dist`

## Security Notes

⚠️ **Important**: The token protection (`?key=DEV1234`) is **client-side only** and is **NOT secure**. It's intended for lightweight development access control only.

For production:
- Use proper authentication
- Implement server-side route protection
- Use environment-based access control
- Consider IP whitelisting for internal routes

## Workflow Example

### Daily Development
1. Start watch mode: `./scripts/auto-deploy-frontend.sh watch`
2. Make changes in `frontend/src/`
3. Changes auto-build and deploy
4. Test at: `https://finityplatform.cloud/internal/landing?key=DEV1234`

### Production Deployment
1. Build: `./scripts/auto-deploy-frontend.sh build`
2. Deploy: `./scripts/auto-deploy-frontend.sh deploy`
3. Verify: Visit `https://finityplatform.cloud/` (should show Coming Soon)

## Legacy Route Compatibility

Old routes automatically redirect to internal routes:
- `/landing` → `/internal/landing?key=DEV1234`
- `/login` → `/internal/login?key=DEV1234`
- etc.

This ensures backward compatibility during the transition period.

## Next Steps

1. Set up SSH keys for passwordless VPS access
2. Configure environment variables
3. Test the deployment script
4. Update the dev key if needed
5. Start using watch mode for development

For questions or issues, refer to the main deployment documentation or contact the development team.

