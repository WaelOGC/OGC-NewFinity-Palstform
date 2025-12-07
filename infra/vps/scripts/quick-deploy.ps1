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
# OGC NewFinity Platform - Quick Deploy Script (PowerShell)
# ============================================================================
# For Windows users - Quick deploy to VPS
# ============================================================================

param(
    [string]$VPSUser = "root",
    [string]$VPSHost = "finityplatform.cloud",
    [string]$VPSPath = "/var/www/ogc-platform/frontend/dist",
    [switch]$ReloadNginx
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$FrontendDir = Join-Path $ProjectRoot "frontend"
$DistDir = Join-Path $FrontendDir "dist"

Write-Host "========================================" -ForegroundColor Green
Write-Host "🚀 QUICK DEPLOY FRONTEND" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Build
Write-Host "🏗️  Building frontend..." -ForegroundColor Yellow
Push-Location $FrontendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 2: Check dist exists
if (-not (Test-Path $DistDir)) {
    Write-Host "❌ dist/ directory not found!" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy via rsync (if available) or scp
Write-Host "📤 Deploying to VPS..." -ForegroundColor Yellow
Write-Host "  Source: $DistDir\" -ForegroundColor Cyan
Write-Host "  Target: ${VPSUser}@${VPSHost}:${VPSPath}/" -ForegroundColor Cyan

# Check if rsync is available (via WSL or Git Bash)
$rsyncAvailable = $false
$rsyncCmd = $null
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    $rsyncAvailable = $true
    $rsyncCmd = "wsl"
    $rsyncArgs = "rsync", "-avz", "--delete", "$($DistDir -replace '\\', '/')/", "${VPSUser}@${VPSHost}:${VPSPath}/"
} elseif (Get-Command rsync -ErrorAction SilentlyContinue) {
    $rsyncAvailable = $true
    $rsyncCmd = "rsync"
    $rsyncArgs = "-avz", "--delete", "$($DistDir -replace '\\', '/')/", "${VPSUser}@${VPSHost}:${VPSPath}/"
}

if ($rsyncAvailable) {
    # Use rsync
    if ($rsyncCmd -eq "wsl") {
        & wsl $rsyncArgs
    } else {
        & $rsyncCmd $rsyncArgs
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "  Check SSH connection: ssh ${VPSUser}@${VPSHost}" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Files synced successfully" -ForegroundColor Green
    
    # Verify deployment
    Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow
    $verifyCmd = "ssh ${VPSUser}@${VPSHost} 'test -f ${VPSPath}/index.html && echo OK || echo MISSING'"
    $verifyResult = if ($rsyncCmd -eq "wsl") { wsl bash -c $verifyCmd } else { bash -c $verifyCmd }
    if ($verifyResult -match "OK") {
        Write-Host "✅ Deployment verified: index.html exists on VPS" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: Could not verify index.html on VPS" -ForegroundColor Yellow
    }
} else {
    # Fallback to scp (less efficient but works)
    Write-Host "⚠️  rsync not available, using scp (slower)..." -ForegroundColor Yellow
    $scpArgs = "-r", "$DistDir\*", "${VPSUser}@${VPSHost}:${VPSPath}/"
    scp $scpArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "  Check SSH connection: ssh ${VPSUser}@${VPSHost}" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Files copied successfully" -ForegroundColor Green
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green

# Step 4: Reload Nginx if requested
if ($ReloadNginx) {
    Write-Host "🔄 Reloading Nginx..." -ForegroundColor Yellow
    ssh "${VPSUser}@${VPSHost}" "sudo systemctl reload nginx"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Nginx reloaded" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Nginx reload failed (may need manual reload)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
