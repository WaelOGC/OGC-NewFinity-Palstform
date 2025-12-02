# ============================================================================
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

$ProjectRoot = Split-Path -Parent $PSScriptRoot
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

# Check if rsync is available (via WSL or Git Bash)
$rsyncAvailable = $false
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    $rsyncAvailable = $true
    $rsyncCmd = "wsl rsync"
} elseif (Get-Command rsync -ErrorAction SilentlyContinue) {
    $rsyncAvailable = $true
    $rsyncCmd = "rsync"
}

if ($rsyncAvailable) {
    # Use rsync
    $rsyncArgs = "-avz", "--delete", "$DistDir/", "${VPSUser}@${VPSHost}:${VPSPath}/"
    & $rsyncCmd.Split(' ') $rsyncArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
} else {
    # Fallback to scp (less efficient but works)
    Write-Host "⚠️  rsync not available, using scp (slower)..." -ForegroundColor Yellow
    $scpArgs = "-r", "$DistDir/*", "${VPSUser}@${VPSHost}:${VPSPath}/"
    scp $scpArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
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

