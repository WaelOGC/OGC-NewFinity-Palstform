#!/bin/bash

# ============================================================================
# OGC NewFinity Platform - Health Check Script
# ============================================================================
# This script performs comprehensive health checks:
# - Checks /api/status endpoint
# - Checks /api/health endpoint
# - Checks frontend root availability
# - Returns JSON-formatted output
# ============================================================================

set -e  # Exit on any error

# Colors for output (for human-readable mode)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://127.0.0.1:4000"
FRONTEND_URL="http://127.0.0.1"
JSON_OUTPUT=false

# Parse arguments
if [ "$1" == "--json" ] || [ "$1" == "-j" ]; then
    JSON_OUTPUT=true
fi

# Initialize results
STATUS_CODE=0
RESULTS=""

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local response_code
    local response_time
    
    if command -v curl &> /dev/null; then
        # Get response code and time
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${url}" 2>/dev/null || echo "000")
        response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "${url}" 2>/dev/null || echo "0.000")
        
        if [ "${response_code}" == "200" ]; then
            if [ "$JSON_OUTPUT" = true ]; then
                RESULTS="${RESULTS}\"${name}\":{\"status\":\"ok\",\"code\":${response_code},\"response_time\":${response_time}},"
            else
                echo -e "${GREEN}✅ ${name}: OK (${response_code}, ${response_time}s)${NC}"
            fi
            return 0
        else
            if [ "$JSON_OUTPUT" = true ]; then
                RESULTS="${RESULTS}\"${name}\":{\"status\":\"error\",\"code\":${response_code},\"response_time\":${response_time}},"
            else
                echo -e "${RED}❌ ${name}: FAILED (HTTP ${response_code})${NC}"
            fi
            STATUS_CODE=1
            return 1
        fi
    else
        if [ "$JSON_OUTPUT" = true ]; then
            RESULTS="${RESULTS}\"${name}\":{\"status\":\"error\",\"message\":\"curl not available\"},"
        else
            echo -e "${RED}❌ ${name}: ERROR (curl not available)${NC}"
        fi
        STATUS_CODE=1
        return 1
    fi
}

# Function to check service process
check_process() {
    local name=$1
    local process_pattern=$2
    
    if pgrep -f "${process_pattern}" > /dev/null 2>&1; then
        if [ "$JSON_OUTPUT" = true ]; then
            RESULTS="${RESULTS}\"${name}_process\":{\"status\":\"ok\"},"
        else
            echo -e "${GREEN}✅ ${name} process: RUNNING${NC}"
        fi
        return 0
    else
        if [ "$JSON_OUTPUT" = true ]; then
            RESULTS="${RESULTS}\"${name}_process\":{\"status\":\"error\",\"message\":\"process not found\"},"
        else
            echo -e "${RED}❌ ${name} process: NOT RUNNING${NC}"
        fi
        STATUS_CODE=1
        return 1
    fi
}

# Start health check
if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🏥 HEALTH CHECK${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
fi

# Check backend status endpoint
check_endpoint "backend_status" "${BACKEND_URL}/api/status"

# Check backend health endpoint
check_endpoint "backend_health" "${BACKEND_URL}/api/health"

# Check frontend root
check_endpoint "frontend_root" "${FRONTEND_URL}/"

# Check Nginx process
check_process "nginx" "nginx:"

# Check PM2 processes
if command -v pm2 &> /dev/null; then
    PM2_COUNT=$(pm2 jlist | jq 'length' 2>/dev/null || echo "0")
    if [ "$JSON_OUTPUT" = true ]; then
        RESULTS="${RESULTS}\"pm2_apps\":{\"count\":${PM2_COUNT}},"
    else
        if [ "${PM2_COUNT}" -gt 0 ]; then
            echo -e "${GREEN}✅ PM2 apps: ${PM2_COUNT} running${NC}"
        else
            echo -e "${RED}❌ PM2 apps: None running${NC}"
            STATUS_CODE=1
        fi
    fi
fi

# Output results
if [ "$JSON_OUTPUT" = true ]; then
    # Remove trailing comma and wrap in JSON
    RESULTS="{${RESULTS%,}}"
    echo "${RESULTS}"
else
    echo ""
    if [ $STATUS_CODE -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
        echo -e "${GREEN}========================================${NC}"
    else
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
        echo -e "${RED}========================================${NC}"
    fi
fi

exit $STATUS_CODE

