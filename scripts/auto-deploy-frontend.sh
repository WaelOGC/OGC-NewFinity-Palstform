#!/bin/bash

# ============================================================================
# OGC NewFinity Platform - Auto-Deploy Frontend Script
# ============================================================================
# This script:
# 1. Watches for changes in frontend/src
# 2. Automatically builds when changes are detected
# 3. Syncs dist/ to VPS via rsync
# 4. Optionally restarts Nginx
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"

# VPS Configuration (update these)
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-finityplatform.cloud}"
VPS_PATH="${VPS_PATH:-/var/www/ogc-platform/frontend/dist}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}❌ rsync is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 AUTO-DEPLOY FRONTEND${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}Configuration:${NC}"
echo "  VPS Host: ${VPS_HOST}"
echo "  VPS Path: ${VPS_PATH}"
echo "  Local Dist: ${DIST_DIR}"
echo ""

# Function to build frontend
build_frontend() {
    echo -e "${YELLOW}🏗️  Building frontend...${NC}"
    cd "${FRONTEND_DIR}"
    
    if npm run build; then
        echo -e "${GREEN}✅ Build successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        return 1
    fi
}

# Function to deploy to VPS
deploy_to_vps() {
    if [ ! -d "${DIST_DIR}" ]; then
        echo -e "${RED}❌ dist/ directory not found. Build first.${NC}"
        return 1
    fi

    echo -e "${YELLOW}📤 Deploying to VPS...${NC}"
    
    # Use rsync to sync files
    RSYNC_CMD="rsync -avz --delete"
    
    # Add SSH key if specified
    if [ -f "${SSH_KEY}" ]; then
        RSYNC_CMD="${RSYNC_CMD} -e 'ssh -i ${SSH_KEY}'"
    fi
    
    # Sync dist/ to VPS
    if eval "${RSYNC_CMD} ${DIST_DIR}/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"; then
        echo -e "${GREEN}✅ Deployment successful${NC}"
        
        # Optionally reload Nginx
        if [ "${RELOAD_NGINX}" = "true" ]; then
            echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
            if [ -f "${SSH_KEY}" ]; then
                ssh -i "${SSH_KEY}" "${VPS_USER}@${VPS_HOST}" "sudo systemctl reload nginx"
            else
                ssh "${VPS_USER}@${VPS_HOST}" "sudo systemctl reload nginx"
            fi
            echo -e "${GREEN}✅ Nginx reloaded${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        return 1
    fi
}

# Main execution
if [ "$1" = "build" ]; then
    build_frontend
elif [ "$1" = "deploy" ]; then
    deploy_to_vps
elif [ "$1" = "watch" ]; then
    echo -e "${CYAN}👀 Starting watch mode...${NC}"
    echo "Watching for changes in ${FRONTEND_DIR}/src"
    echo "Press Ctrl+C to stop"
    echo ""
    
    # Use node watch script if available, otherwise use inotifywait or fswatch
    if command -v node &> /dev/null && [ -f "${PROJECT_ROOT}/scripts/watch-and-build.js" ]; then
        node "${PROJECT_ROOT}/scripts/watch-and-build.js" &
        WATCH_PID=$!
        
        # Wait for build, then deploy
        sleep 5
        
        while true; do
            if [ -d "${DIST_DIR}" ] && [ -f "${DIST_DIR}/index.html" ]; then
                # Check if dist was recently modified (within last 10 seconds)
                if [ $(find "${DIST_DIR}" -type f -newermt "10 seconds ago" | wc -l) -gt 0 ]; then
                    deploy_to_vps
                    sleep 10 # Wait before checking again
                fi
            fi
            sleep 2
        fi
    else
        echo -e "${RED}❌ Watch script not available. Please use 'build' or 'deploy' manually.${NC}"
        exit 1
    fi
else
    echo "Usage: $0 [build|deploy|watch]"
    echo ""
    echo "Commands:"
    echo "  build   - Build frontend once"
    echo "  deploy  - Deploy dist/ to VPS once"
    echo "  watch   - Watch for changes and auto-build + deploy"
    echo ""
    echo "Environment variables:"
    echo "  VPS_USER     - SSH user (default: root)"
    echo "  VPS_HOST     - VPS hostname (default: finityplatform.cloud)"
    echo "  VPS_PATH     - VPS deployment path (default: /var/www/ogc-platform/frontend/dist)"
    echo "  SSH_KEY      - SSH key path (default: ~/.ssh/id_rsa)"
    echo "  RELOAD_NGINX - Set to 'true' to reload Nginx after deploy (default: false)"
    exit 1
fi

