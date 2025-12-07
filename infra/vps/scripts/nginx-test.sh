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
#   - No Nginx needed locally
# ============================================================================
#
# OGC NewFinity Platform - Nginx Configuration Test Script
# ============================================================================
# This script validates Nginx configuration:
# - Runs `sudo nginx -t`
# - Prints detailed output
# - Returns appropriate exit code
# ============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔍 NGINX CONFIGURATION TEST${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if nginx command exists
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ ERROR: nginx command not found${NC}"
    echo "Please ensure Nginx is installed."
    exit 1
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
    echo -e "${RED}❌ ERROR: sudo command not found${NC}"
    echo "This script requires sudo to test Nginx configuration."
    exit 1
fi

# Run Nginx configuration test
echo -e "${YELLOW}Running: sudo nginx -t${NC}"
echo ""

if sudo nginx -t 2>&1; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ NGINX CONFIGURATION IS VALID${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "You can safely reload or restart Nginx."
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ NGINX CONFIGURATION TEST FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Check the error messages above"
    echo "2. Verify syntax in your Nginx configuration files"
    echo "3. Check file permissions and paths"
    echo "4. Ensure all referenced files exist"
    echo ""
    echo "Common Nginx config locations:"
    echo "  - /etc/nginx/nginx.conf (main config)"
    echo "  - /etc/nginx/sites-available/ (site configs)"
    echo "  - /etc/nginx/sites-enabled/ (enabled sites)"
    echo ""
    exit $EXIT_CODE
fi
