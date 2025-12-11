# OGC NewFinity Platform - Social Auth Migration Script
# This script runs the social authentication migration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Social Auth Migration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials
$dbUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$dbName = Read-Host "Enter database name (default: ogc_newfinity)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "ogc_newfinity"
}

$dbPassword = Read-Host "Enter MySQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Yellow

# Run the migration
$sqlFile = Join-Path $PSScriptRoot "sql\social-auth-migration.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: Migration file not found at: $sqlFile" -ForegroundColor Red
    exit 1
}

# Use mysql with password from environment variable to avoid prompt
$env:MYSQL_PWD = $dbPasswordPlain
Get-Content $sqlFile | mysql -u $dbUser ogc_newfinity
$result = $LASTEXITCODE
$env:MYSQL_PWD = $null

if ($result -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The following columns have been added to the User table:" -ForegroundColor Cyan
    Write-Host "  - googleId, githubId, twitterId, linkedinId, discordId" -ForegroundColor White
    Write-Host "  - authProvider, avatarUrl" -ForegroundColor White
    Write-Host "  - Indexes for all OAuth provider IDs" -ForegroundColor White
    Write-Host "  - Password column is now nullable" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Migration failed with exit code: $result" -ForegroundColor Red
    Write-Host "Please check your MySQL credentials and try again." -ForegroundColor Yellow
    exit $result
}

