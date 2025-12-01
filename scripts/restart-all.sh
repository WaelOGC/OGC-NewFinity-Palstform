#!/bin/bash

# ============================================================================
# OGC NewFinity Platform - Restart All Services Script
# ============================================================================
# This script restarts all platform services:
# - Restarts Nginx
# - Restarts all PM2 apps
# - Prints server status
# ============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔄 RESTARTING ALL SERVICES${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================================================
# STEP 1: Restart Nginx
# ============================================================================
echo -e "${YELLOW}🌐 STEP 1: Restarting Nginx...${NC}"

# Test Nginx configuration first
if sudo nginx -t 2>&1; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    
    # Reload Nginx (graceful restart)
    if sudo systemctl reload nginx 2>&1; then
        echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
    else
        echo -e "${RED}❌ ERROR: Failed to reload Nginx${NC}"
        echo "Attempting full restart..."
        if sudo systemctl restart nginx 2>&1; then
            echo -e "${GREEN}✅ Nginx restarted successfully${NC}"
        else
            echo -e "${RED}❌ ERROR: Failed to restart Nginx${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ ERROR: Nginx configuration test failed${NC}"
    echo "Please fix Nginx configuration before restarting."
    exit 1
fi
echo ""

# ============================================================================
# STEP 2: Restart All PM2 Apps
# ============================================================================
echo -e "${YELLOW}🔄 STEP 2: Restarting all PM2 apps...${NC}"

if pm2 restart all 2>&1; then
    echo -e "${GREEN}✅ All PM2 apps restarted successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to restart PM2 apps${NC}"
    exit 1
fi

# Save PM2 process list
pm2 save 2>&1 || echo -e "${YELLOW}⚠️  Warning: Could not save PM2 process list${NC}"
echo ""

# ============================================================================
# STEP 3: Print Server Status
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 SERVER STATUS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Nginx Status
echo -e "${YELLOW}Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi
echo ""

# PM2 Status
echo -e "${YELLOW}PM2 Apps Status:${NC}"
pm2 list
echo ""

# PM2 Process Info
echo -e "${YELLOW}PM2 Process Details:${NC}"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) (PID: \(.pid), Uptime: \(.pm2_env.pm_uptime))"' 2>/dev/null || pm2 list
echo ""

# System Resources (if available)
if command -v free &> /dev/null; then
    echo -e "${YELLOW}System Memory:${NC}"
    free -h
    echo ""
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SERVICE RESTART COMPLETED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

