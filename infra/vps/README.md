# VPS/Production Deployment Files

This directory contains all files related to production deployment on the VPS. **These files are NOT needed for local development.**

## Directory Structure

```
infra/vps/
├── nginx/              # Nginx configuration files
│   └── nginx-finityplatform.cloud.conf
├── scripts/            # Deployment and management scripts
│   ├── auto-deploy-frontend.sh
│   ├── deploy-frontend.sh
│   ├── deploy-backend.sh
│   ├── restart-all.sh
│   ├── health-check.sh
│   ├── rollback-backend.sh
│   ├── verify-deployment.sh
│   ├── nginx-test.sh
│   └── quick-deploy.ps1
└── README.md           # This file
```

## Important Notes

- **Local Development**: Do NOT use these files for local development
- **Production Only**: These files are designed for VPS deployment with:
  - PM2 process manager
  - Nginx web server
  - SSL certificates (Let's Encrypt)
  - Production domain (finityplatform.cloud)

## For Local Development

Use the standard npm scripts from the project root:

```powershell
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
```

See `DEV-SETUP-LOCAL.md` in the project root for complete local development instructions.

## File Descriptions

### Nginx Configuration

- `nginx/nginx-finityplatform.cloud.conf` - Production Nginx configuration
  - Serves frontend from `/var/www/ogc-platform/frontend/dist`
  - Proxies `/api/*` to backend on `127.0.0.1:4000`
  - Handles SSL/TLS with Certbot
  - Includes security headers and optimizations

### Deployment Scripts

- `scripts/auto-deploy-frontend.sh` - Auto-deploy frontend with watch mode
- `scripts/deploy-frontend.sh` - Deploy frontend to VPS
- `scripts/deploy-backend.sh` - Deploy backend to VPS with PM2
- `scripts/restart-all.sh` - Restart all services (Nginx + PM2)
- `scripts/health-check.sh` - Health check script for production
- `scripts/rollback-backend.sh` - Rollback backend to previous Git version
- `scripts/verify-deployment.sh` - Verify deployment is working
- `scripts/nginx-test.sh` - Test Nginx configuration
- `scripts/quick-deploy.ps1` - PowerShell script for Windows users

## Usage (Production Only)

These scripts assume:
- Project is deployed at `/var/www/ogc-platform` on the VPS
- PM2 is installed and configured
- Nginx is installed and configured
- SSH access to the VPS is set up

Example usage (on VPS or from local machine with SSH access):

```bash
# Deploy frontend
./infra/vps/scripts/deploy-frontend.sh

# Deploy backend
./infra/vps/scripts/deploy-backend.sh

# Restart all services
./infra/vps/scripts/restart-all.sh

# Health check
./infra/vps/scripts/health-check.sh
```

## Configuration

All scripts use environment variables for configuration:

```bash
export VPS_USER="root"
export VPS_HOST="finityplatform.cloud"
export VPS_PATH="/var/www/ogc-platform/frontend/dist"
export SSH_KEY="~/.ssh/id_rsa"
```
