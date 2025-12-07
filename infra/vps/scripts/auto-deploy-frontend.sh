#!/bin/bash

# ============================================================================
# PRODUCTION/VPS ONLY - NOT FOR LOCAL DEVELOPMENT
# ============================================================================
# This script is for production deployment to VPS only.
# Local development does NOT require or use this file.
# 
# For local development, use:
#   - Frontend: npm run dev (in frontend/)
#   - Backend: npm run dev (in backend/)
#   - No deployment scripts needed locally
# ============================================================================
#
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
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
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

    if [ ! -f "${DIST_DIR}/index.html" ]; then
        echo -e "${RED}❌ index.html not found in dist/. Build may have failed.${NC}"
        return 1
    fi

    echo -e "${YELLOW}📤 Deploying to VPS...${NC}"
    echo "  Source: ${DIST_DIR}/"
    echo "  Target: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"
    
    # Expand SSH key path
    SSH_KEY_EXPANDED="${SSH_KEY/#\~/$HOME}"
    
    # Build rsync command
    RSYNC_ARGS=(-avz --delete)
    
    # Add SSH key if specified and exists
    if [ -n "${SSH_KEY}" ] && [ -f "${SSH_KEY_EXPANDED}" ]; then
        RSYNC_ARGS+=(-e "ssh -i ${SSH_KEY_EXPANDED} -o StrictHostKeyChecking=no")
        echo "  Using SSH key: ${SSH_KEY_EXPANDED}"
    else
        RSYNC_ARGS+=(-e "ssh -o StrictHostKeyChecking=no")
        echo "  Using default SSH authentication"
    fi
    
    # Sync dist/ to VPS
    if rsync "${RSYNC_ARGS[@]}" "${DIST_DIR}/" "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"; then
        echo -e "${GREEN}✅ Files synced successfully${NC}"
        
        # Verify deployment
        echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
        if [ -f "${SSH_KEY_EXPANDED}" ]; then
            SSH_CMD="ssh -i ${SSH_KEY_EXPANDED} -o StrictHostKeyChecking=no"
        else
            SSH_CMD="ssh -o StrictHostKeyChecking=no"
        fi
        
        if eval "${SSH_CMD} ${VPS_USER}@${VPS_HOST} 'test -f ${VPS_PATH}/index.html'"; then
            echo -e "${GREEN}✅ Deployment verified: index.html exists on VPS${NC}"
        else
            echo -e "${YELLOW}⚠️  Warning: Could not verify index.html on VPS${NC}"
        fi
        
        # Reload Nginx (default to true, can be disabled)
        if [ "${RELOAD_NGINX}" != "false" ]; then
            echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
            if eval "${SSH_CMD} ${VPS_USER}@${VPS_HOST} 'sudo systemctl reload nginx'"; then
                echo -e "${GREEN}✅ Nginx reloaded${NC}"
            else
                echo -e "${YELLOW}⚠️  Nginx reload failed (may need manual reload)${NC}"
                echo "  Run on VPS: sudo systemctl reload nginx"
            fi
        fi
        
        return 0
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        echo "  Check SSH connection and permissions"
        echo "  Test: ssh ${VPS_USER}@${VPS_HOST} 'ls -la ${VPS_PATH}'"
        return 1
    fi
}

# Function to build and deploy
build_and_deploy() {
    if build_frontend; then
        deploy_to_vps
    else
        return 1
    fi
}

# Main execution
if [ "$1" = "build" ]; then
    build_frontend
elif [ "$1" = "deploy" ]; then
    deploy_to_vps
elif [ "$1" = "build-deploy" ] || [ "$1" = "all" ]; then
    build_and_deploy
elif [ "$1" = "watch" ]; then
    echo -e "${CYAN}👀 Starting watch mode...${NC}"
    echo "Watching for changes in ${FRONTEND_DIR}/src"
    echo "Press Ctrl+C to stop"
    echo ""
    
    # Use node watch script if available
    if command -v node &> /dev/null && [ -f "${PROJECT_ROOT}/scripts/watch-and-build.cjs" ]; then
        node "${PROJECT_ROOT}/scripts/watch-and-build.cjs" &
        WATCH_PID=$!
        
        # Wait for initial build, then deploy
        sleep 5
        
        # Deploy initial build
        if [ -d "${DIST_DIR}" ] && [ -f "${DIST_DIR}/index.html" ]; then
            deploy_to_vps
        fi
        
        # Monitor for changes and deploy
        LAST_BUILD_TIME=0
        while true; do
            if [ -d "${DIST_DIR}" ] && [ -f "${DIST_DIR}/index.html" ]; then
                # Check if dist was recently modified
                if command -v stat > /dev/null 2>&1; then
                    # Linux stat
                    CURRENT_BUILD_TIME=$(stat -c %Y "${DIST_DIR}/index.html" 2>/dev/null || echo 0)
                else
                    # macOS stat or fallback
                    CURRENT_BUILD_TIME=$(stat -f %m "${DIST_DIR}/index.html" 2>/dev/null || echo 0)
                fi
                
                if [ "${CURRENT_BUILD_TIME}" -gt "${LAST_BUILD_TIME}" ] && [ "${LAST_BUILD_TIME}" -gt 0 ]; then
                    LAST_BUILD_TIME=${CURRENT_BUILD_TIME}
                    echo -e "${CYAN}📦 New build detected, deploying...${NC}"
                    deploy_to_vps
                elif [ "${LAST_BUILD_TIME}" -eq 0 ]; then
                    # Initialize on first run
                    LAST_BUILD_TIME=${CURRENT_BUILD_TIME}
                fi
            fi
            sleep 3
        done
    else
        echo -e "${RED}❌ Watch script not available. Please use 'build-deploy' manually.${NC}"
        exit 1
    fi
else
    echo "Usage: $0 [build|deploy|build-deploy|watch]"
    echo ""
    echo "Commands:"
    echo "  build        - Build frontend once"
    echo "  deploy       - Deploy dist/ to VPS once (requires existing build)"
    echo "  build-deploy - Build and deploy in one step (recommended)"
    echo "  watch        - Watch for changes and auto-build + deploy"
    echo ""
    echo "Environment variables:"
    echo "  VPS_USER     - SSH user (default: root)"
    echo "  VPS_HOST     - VPS hostname (default: finityplatform.cloud)"
    echo "  VPS_PATH     - VPS deployment path (default: /var/www/ogc-platform/frontend/dist)"
    echo "  SSH_KEY      - SSH key path (default: ~/.ssh/id_rsa)"
    echo "  RELOAD_NGINX - Set to 'false' to skip Nginx reload (default: true)"
    exit 1
fi
