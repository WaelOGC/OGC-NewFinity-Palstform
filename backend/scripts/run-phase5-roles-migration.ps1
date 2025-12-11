# ============================================================================
# OGC NewFinity Platform - Phase 5 Roles & Permissions Migration Script
# ============================================================================
# 
# Usage (PowerShell):
#   cd backend
#   $env:MYSQL_PWD = "your_mysql_password_here"
#   ./scripts/run-phase5-roles-migration.ps1
#
# Or with explicit database name:
#   $env:MYSQL_PWD = "your_mysql_password_here"
#   $env:DB_NAME = "ogc_newfinity"
#   ./scripts/run-phase5-roles-migration.ps1
#
# ============================================================================

$ErrorActionPreference = "Stop"

# Get database name from environment or use default
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "ogc_newfinity" }

# Get MySQL password from environment
$mysqlPwd = $env:MYSQL_PWD
if (-not $mysqlPwd) {
    Write-Host "ERROR: MYSQL_PWD environment variable is not set." -ForegroundColor Red
    Write-Host "Please set it before running this script:" -ForegroundColor Yellow
    Write-Host "  `$env:MYSQL_PWD = 'your_mysql_password_here'" -ForegroundColor Yellow
    exit 1
}

# Get MySQL user from environment or use default
$mysqlUser = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "root" }

# Get MySQL host from environment or use default
$mysqlHost = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { "localhost" }

# Path to migration file (relative to backend directory)
$migrationFile = "sql\account-system-phase5-roles-permissions-migration.sql"

# Check if migration file exists
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    Write-Host "Please ensure you're running this script from the backend directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "OGC NewFinity Platform - Phase 5 Migration" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "User: $mysqlUser" -ForegroundColor Yellow
Write-Host "Host: $mysqlHost" -ForegroundColor Yellow
Write-Host "Migration file: $migrationFile" -ForegroundColor Yellow
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Do you want to proceed with the migration? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Green

try {
    # Run MySQL command
    $mysqlCmd = "mysql -u $mysqlUser -p$mysqlPwd -h $mysqlHost $dbName"
    Get-Content $migrationFile | & cmd /c $mysqlCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================================================" -ForegroundColor Green
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        Write-Host "============================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "The User table now includes:" -ForegroundColor Cyan
        Write-Host "  - role (VARCHAR(50), NOT NULL, DEFAULT 'STANDARD_USER')" -ForegroundColor White
        Write-Host "  - permissions (JSON, NULL)" -ForegroundColor White
        Write-Host "  - featureFlags (JSON, NULL)" -ForegroundColor White
        Write-Host ""
        Write-Host "All existing users have been migrated to STANDARD_USER role." -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERROR: Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Please check the error messages above and ensure:" -ForegroundColor Yellow
        Write-Host "  1. MySQL is running" -ForegroundColor Yellow
        Write-Host "  2. Database '$dbName' exists" -ForegroundColor Yellow
        Write-Host "  3. User '$mysqlUser' has proper permissions" -ForegroundColor Yellow
        Write-Host "  4. Password is correct" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to run migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure MySQL is installed and accessible from the command line." -ForegroundColor Yellow
    exit 1
}
