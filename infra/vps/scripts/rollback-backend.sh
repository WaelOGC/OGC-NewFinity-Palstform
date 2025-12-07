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
#   - No rollback scripts needed locally (use git reset locally)
# ============================================================================
#
# OGC NewFinity Platform - Backend Rollback Script
# ============================================================================
# This script rolls back the backend to a previous Git version:
# - Restores previous backend version from Git
# - Restarts PM2 backend
# - Validates endpoints
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
echo -e "${GREEN}⏪ BACKEND ROLLBACK${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Validate we're in the right directory
if [ ! -d "${PROJECT_ROOT}" ]; then
    echo -e "${RED}❌ ERROR: Project root not found at ${PROJECT_ROOT}${NC}"
    exit 1
fi

if [ ! -d "${BACKEND_DIR}" ]; then
    echo -e "${RED}❌ ERROR: Backend directory not found at ${BACKEND_DIR}${NC}"
    exit 1
fi

cd "${BACKEND_DIR}"

# ============================================================================
# STEP 1: Show Git History
# ============================================================================
echo -e "${YELLOW}📜 Recent Git commits:${NC}"
git log --oneline -10
echo ""

# ============================================================================
# STEP 2: Get Target Commit
# ============================================================================
if [ -z "$1" ]; then
    echo -e "${YELLOW}Please specify a commit hash or 'HEAD~1' to rollback to.${NC}"
    echo "Usage: $0 <commit-hash|HEAD~1>"
    echo ""
    echo "Examples:"
    echo "  $0 HEAD~1          # Rollback to previous commit"
    echo "  $0 abc1234         # Rollback to specific commit"
    exit 1
fi

TARGET_COMMIT="$1"

# Validate commit exists
if ! git rev-parse --verify "${TARGET_COMMIT}" > /dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: Invalid commit: ${TARGET_COMMIT}${NC}"
    exit 1
fi

CURRENT_COMMIT=$(git rev-parse HEAD)
TARGET_COMMIT_FULL=$(git rev-parse "${TARGET_COMMIT}")

echo -e "${YELLOW}Current commit: ${CURRENT_COMMIT:0:7}${NC}"
echo -e "${YELLOW}Target commit:  ${TARGET_COMMIT_FULL:0:7}${NC}"
echo ""

# Show commit message
echo -e "${YELLOW}Target commit message:${NC}"
git log -1 --format="%B" "${TARGET_COMMIT}"
echo ""

# Confirmation prompt
read -p "Are you sure you want to rollback to this commit? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# ============================================================================
# STEP 3: Rollback Code
# ============================================================================
echo -e "${YELLOW}⏪ STEP 1: Rolling back code to ${TARGET_COMMIT:0:7}...${NC}"

# Reset to target commit (hard reset - this will discard local changes)
if git reset --hard "${TARGET_COMMIT}" 2>&1; then
    echo -e "${GREEN}✅ Code rolled back successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to rollback code${NC}"
    exit 1
fi
echo ""

# ============================================================================
# STEP 4: Reinstall Dependencies (in case package.json changed)
# ============================================================================
echo -e "${YELLOW}📦 STEP 2: Reinstalling dependencies...${NC}"
if npm install 2>&1; then
    echo -e "${GREEN}✅ Dependencies reinstalled${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to reinstall dependencies${NC}"
    exit 1
fi
echo ""

# ============================================================================
# STEP 5: Handle Prisma (if exists)
# ============================================================================
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${YELLOW}🗄️  STEP 3: Regenerating Prisma Client...${NC}"
    
    if npm run prisma:gen 2>&1; then
        echo -e "${GREEN}✅ Prisma Client regenerated${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Prisma Client generation had issues${NC}"
    fi
    echo ""
fi

# ============================================================================
# STEP 6: Restart Backend with PM2
# ============================================================================
echo -e "${YELLOW}🔄 STEP 4: Restarting backend with PM2...${NC}"

if pm2 restart "${PM2_APP_NAME}" 2>&1; then
    echo -e "${GREEN}✅ Backend restarted successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to restart PM2 app${NC}"
    exit 1
fi

pm2 save 2>&1 || echo -e "${YELLOW}⚠️  Warning: Could not save PM2 process list${NC}"
echo ""

# ============================================================================
# STEP 7: Validate Endpoints
# ============================================================================
echo -e "${YELLOW}🔍 STEP 5: Validating backend endpoints...${NC}"

# Wait for server to start
sleep 3

VALIDATION_FAILED=0

# Check /api/status
if curl -f -s http://127.0.0.1:4000/api/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend status endpoint is responding${NC}"
else
    echo -e "${RED}❌ ERROR: Backend status endpoint is not responding${NC}"
    VALIDATION_FAILED=1
fi

# Check /api/health
if curl -f -s http://127.0.0.1:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health endpoint is responding${NC}"
else
    echo -e "${RED}❌ ERROR: Backend health endpoint is not responding${NC}"
    VALIDATION_FAILED=1
fi

if [ $VALIDATION_FAILED -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Checking PM2 logs...${NC}"
    pm2 logs "${PM2_APP_NAME}" --lines 30 --nostream
    echo ""
    echo -e "${RED}❌ Rollback completed but validation failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ ROLLBACK COMPLETED SUCCESSFULLY${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend has been rolled back to commit: ${TARGET_COMMIT_FULL:0:7}"
echo "View logs with: pm2 logs ${PM2_APP_NAME}"
echo ""
