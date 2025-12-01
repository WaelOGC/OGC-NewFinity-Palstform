#!/bin/bash

# ============================================================================
# OGC NewFinity Platform - Frontend Deployment Script
# ============================================================================
# This script automates frontend deployment:
# - Pulls latest code from Git
# - Installs frontend dependencies
# - Runs Vite build
# - Validates dist/ folder exists
# ============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root (adjust if needed)
PROJECT_ROOT="/var/www/ogc-platform"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
DIST_DIR="${FRONTEND_DIR}/dist"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 FRONTEND DEPLOYMENT STARTED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Validate we're in the right directory or project root exists
if [ ! -d "${PROJECT_ROOT}" ]; then
    echo -e "${RED}❌ ERROR: Project root not found at ${PROJECT_ROOT}${NC}"
    echo "Please ensure the project is deployed to the correct location."
    exit 1
fi

if [ ! -d "${FRONTEND_DIR}" ]; then
    echo -e "${RED}❌ ERROR: Frontend directory not found at ${FRONTEND_DIR}${NC}"
    exit 1
fi

cd "${FRONTEND_DIR}"

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
echo -e "${YELLOW}📦 STEP 2: Installing frontend dependencies...${NC}"
if npm install 2>&1; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# ============================================================================
# STEP 3: Build Frontend with Vite
# ============================================================================
echo -e "${YELLOW}🏗️  STEP 3: Building frontend with Vite...${NC}"

# Remove old dist folder if it exists (safe operation)
if [ -d "${DIST_DIR}" ]; then
    echo "Removing old dist folder..."
    rm -rf "${DIST_DIR}"
fi

# Run Vite build
if npm run build 2>&1; then
    echo -e "${GREEN}✅ Frontend build completed successfully${NC}"
else
    echo -e "${RED}❌ ERROR: Frontend build failed${NC}"
    exit 1
fi
echo ""

# ============================================================================
# STEP 4: Validate dist/ Folder Exists
# ============================================================================
echo -e "${YELLOW}🔍 STEP 4: Validating dist/ folder...${NC}"

if [ ! -d "${DIST_DIR}" ]; then
    echo -e "${RED}❌ ERROR: dist/ folder was not created${NC}"
    exit 1
fi

if [ ! -f "${DIST_DIR}/index.html" ]; then
    echo -e "${RED}❌ ERROR: index.html not found in dist/ folder${NC}"
    exit 1
fi

# Count files in dist for verification
FILE_COUNT=$(find "${DIST_DIR}" -type f | wc -l)
echo -e "${GREEN}✅ dist/ folder validated (${FILE_COUNT} files found)${NC}"
echo ""

# Show dist folder size
DIST_SIZE=$(du -sh "${DIST_DIR}" | cut -f1)
echo "Dist folder size: ${DIST_SIZE}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ FRONTEND DEPLOYMENT COMPLETED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Frontend build is ready!"
echo "Nginx should automatically serve from: ${DIST_DIR}"
echo ""

