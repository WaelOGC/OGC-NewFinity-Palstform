#!/bin/bash

# ============================================================================
# OGC NewFinity Platform - Backend Deployment Script
# ============================================================================
# This script automates backend deployment:
# - Pulls latest code from Git
# - Installs dependencies
# - Applies Prisma migrations
# - Restarts backend with PM2
# - Validates backend is online
# ============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root (adjust if needed)
PROJECT_ROOT="/var/www/ogc-platform"
BACKEND_DIR="${PROJECT_ROOT}/backend"
PM2_APP_NAME="ogc-backend"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 BACKEND DEPLOYMENT STARTED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Validate we're in the right directory or project root exists
if [ ! -d "${PROJECT_ROOT}" ]; then
    echo -e "${RED}❌ ERROR: Project root not found at ${PROJECT_ROOT}${NC}"
    echo "Please ensure the project is deployed to the correct location."
    exit 1
fi

if [ ! -d "${BACKEND_DIR}" ]; then
    echo -e "${RED}❌ ERROR: Backend directory not found at ${BACKEND_DIR}${NC}"
    exit 1
fi

cd "${BACKEND_DIR}"

# ============================================================================
# STEP 1: Pull Latest Code
# ============================================================================
echo -e "${YELLOW}📥 STEP 1: Pulling latest code from Git...${NC}"
if git pull origin main 2>&1; then
    echo -e "${GREEN}✅ Code pulled successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to pull code from Git${NC}"
    exit 1
fi
echo ""

# ============================================================================
# STEP 2: Install Dependencies
# ============================================================================
echo -e "${YELLOW}📦 STEP 2: Installing backend dependencies...${NC}"
if npm install 2>&1; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# ============================================================================
# STEP 3: Prisma Migrations (if Prisma exists)
# ============================================================================
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${YELLOW}🗄️  STEP 3: Applying Prisma migrations...${NC}"
    
    # Generate Prisma Client
    if npm run prisma:gen 2>&1; then
        echo -e "${GREEN}✅ Prisma Client generated${NC}"
    else
        echo -e "${RED}❌ ERROR: Failed to generate Prisma Client${NC}"
        exit 1
    fi
    
    # Deploy migrations (production-safe)
    if npm run prisma:deploy 2>&1; then
        echo -e "${GREEN}✅ Prisma migrations applied successfully${NC}"
    else
        echo -e "${RED}❌ ERROR: Failed to apply Prisma migrations${NC}"
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}⏭️  STEP 3: Skipping Prisma (schema.prisma not found)${NC}"
    echo ""
fi

# ============================================================================
# STEP 4: Restart Backend with PM2
# ============================================================================
echo -e "${YELLOW}🔄 STEP 4: Restarting backend with PM2...${NC}"

# Check if PM2 app exists
if pm2 list | grep -q "${PM2_APP_NAME}"; then
    echo "PM2 app '${PM2_APP_NAME}' found, restarting..."
    if pm2 restart "${PM2_APP_NAME}" 2>&1; then
        echo -e "${GREEN}✅ Backend restarted successfully${NC}"
    else
        echo -e "${RED}❌ ERROR: Failed to restart PM2 app${NC}"
        exit 1
    fi
else
    echo "PM2 app '${PM2_APP_NAME}' not found, starting..."
    if pm2 start npm --name "${PM2_APP_NAME}" -- run prod 2>&1; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
    else
        echo -e "${RED}❌ ERROR: Failed to start PM2 app${NC}"
        exit 1
    fi
fi

# Save PM2 process list
pm2 save 2>&1 || echo -e "${YELLOW}⚠️  Warning: Could not save PM2 process list${NC}"
echo ""

# ============================================================================
# STEP 5: Validate Backend is Online
# ============================================================================
echo -e "${YELLOW}🔍 STEP 5: Validating backend is online...${NC}"

# Wait a moment for the server to start
sleep 3

# Check /api/status endpoint
if curl -f -s http://127.0.0.1:4000/api/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend status endpoint is responding${NC}"
else
    echo -e "${RED}❌ ERROR: Backend status endpoint is not responding${NC}"
    echo "Checking PM2 logs..."
    pm2 logs "${PM2_APP_NAME}" --lines 20 --nostream
    exit 1
fi

# Check /api/health endpoint
if curl -f -s http://127.0.0.1:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health endpoint is responding${NC}"
else
    echo -e "${RED}❌ ERROR: Backend health endpoint is not responding${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ BACKEND DEPLOYMENT COMPLETED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend is running and healthy!"
echo "View logs with: pm2 logs ${PM2_APP_NAME}"
echo ""

