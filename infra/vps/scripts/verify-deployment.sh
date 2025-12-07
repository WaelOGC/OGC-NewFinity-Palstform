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
#   - No deployment verification scripts needed locally
# ============================================================================
#
# OGC NewFinity Platform - Verify Deployment Script
# ============================================================================
# This script verifies that the deployment is working correctly
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-finityplatform.cloud}"
VPS_PATH="${VPS_PATH:-/var/www/ogc-platform/frontend/dist}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔍 VERIFYING DEPLOYMENT${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Expand SSH key path
SSH_KEY_EXPANDED="${SSH_KEY/#\~/$HOME}"

# Build SSH command
if [ -n "${SSH_KEY}" ] && [ -f "${SSH_KEY_EXPANDED}" ]; then
    SSH_CMD="ssh -i ${SSH_KEY_EXPANDED} -o StrictHostKeyChecking=no"
else
    SSH_CMD="ssh -o StrictHostKeyChecking=no"
fi

echo -e "${CYAN}Checking VPS connection...${NC}"
if ! ${SSH_CMD} "${VPS_USER}@${VPS_HOST}" "echo 'Connection OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to VPS${NC}"
    echo "  Test: ssh ${VPS_USER}@${VPS_HOST}"
    exit 1
fi
echo -e "${GREEN}✅ VPS connection OK${NC}"
echo ""

echo -e "${CYAN}Checking deployment directory...${NC}"
if ! ${SSH_CMD} "${VPS_USER}@${VPS_HOST} test -d ${VPS_PATH}"; then
    echo -e "${RED}❌ Deployment directory does not exist: ${VPS_PATH}${NC}"
    echo "  Create it: ssh ${VPS_USER}@${VPS_HOST} 'sudo mkdir -p ${VPS_PATH} && sudo chown -R \$(whoami):\$(whoami) ${VPS_PATH}'"
    exit 1
fi
echo -e "${GREEN}✅ Deployment directory exists${NC}"
echo ""

echo -e "${CYAN}Checking index.html...${NC}"
if ! ${SSH_CMD} "${VPS_USER}@${VPS_HOST} test -f ${VPS_PATH}/index.html"; then
    echo -e "${RED}❌ index.html not found in ${VPS_PATH}${NC}"
    echo "  Run deployment: ./infra/vps/scripts/auto-deploy-frontend.sh build-deploy"
    exit 1
fi
echo -e "${GREEN}✅ index.html exists${NC}"
echo ""

echo -e "${CYAN}Checking Nginx configuration...${NC}"
if ! ${SSH_CMD} "${VPS_USER}@${VPS_HOST} sudo nginx -t" > /dev/null 2>&1; then
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    echo "  Check: ssh ${VPS_USER}@${VPS_HOST} 'sudo nginx -t'"
    exit 1
fi
echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
echo ""

echo -e "${CYAN}Checking Nginx service...${NC}"
if ! ${SSH_CMD} "${VPS_USER}@${VPS_HOST} systemctl is-active --quiet nginx"; then
    echo -e "${YELLOW}⚠️  Nginx is not running${NC}"
    echo "  Start it: ssh ${VPS_USER}@${VPS_HOST} 'sudo systemctl start nginx'"
else
    echo -e "${GREEN}✅ Nginx is running${NC}"
fi
echo ""

echo -e "${CYAN}Checking file permissions...${NC}"
FILE_PERMS=$(${SSH_CMD} "${VPS_USER}@${VPS_HOST}" "stat -c '%a' ${VPS_PATH}/index.html" 2>/dev/null || echo "unknown")
echo "  index.html permissions: ${FILE_PERMS}"
echo ""

echo -e "${CYAN}Testing HTTP response...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${VPS_HOST}/" || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
    echo -e "${GREEN}✅ Website is accessible (HTTP ${HTTP_CODE})${NC}"
elif [ "${HTTP_CODE}" = "000" ]; then
    echo -e "${YELLOW}⚠️  Could not reach website (connection failed)${NC}"
else
    echo -e "${YELLOW}⚠️  Website returned HTTP ${HTTP_CODE}${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ VERIFICATION COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "If all checks passed, visit: https://${VPS_HOST}/"
echo ""
