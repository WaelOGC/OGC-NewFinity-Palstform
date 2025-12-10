# Wallet API Verification Test Script (PowerShell)
# Tests all wallet endpoints as specified in the verification checklist

# Try port 4000 first (index.js with wallet routes), fallback to 3000
$BASE_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:4000" }
$API_BASE = "$BASE_URL/api/v1"

# Test user credentials
$TEST_USER = @{
    email = "wallet_test@ogc.com"
    password = "Test1234!"
    fullName = "Wallet Test User"
}

$accessToken = $null
$cookies = @{}

# Test results
$results = @{
    passed = @()
    failed = @()
    warnings = @()
}

function Log-Test {
    param($name, $passed, $message = "")
    if ($passed) {
        $results.passed += $name
        Write-Host "✅ $name" -ForegroundColor Green
        if ($message) { Write-Host "   $message" -ForegroundColor Gray }
    } else {
        $results.failed += $name
        Write-Host "❌ $name" -ForegroundColor Red
        if ($message) { Write-Host "   $message" -ForegroundColor Yellow }
    }
}

function Log-Warning {
    param($name, $message)
    $results.warnings += "$name`: $message"
    Write-Host "⚠️  $name`: $message" -ForegroundColor Yellow
}

function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [bool]$UseAuth = $true
    )
    
    $url = "$API_BASE$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($UseAuth -and $accessToken) {
        $headers["Authorization"] = "Bearer $accessToken"
    }
    
    # Build cookie string
    if ($cookies.Count -gt 0) {
        $cookieString = ($cookies.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "; "
        $headers["Cookie"] = $cookieString
    }
    
    $bodyJson = if ($Body) { $Body | ConvertTo-Json } else { $null }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($bodyJson) {
            $params.Body = $bodyJson
        }
        
        $response = Invoke-WebRequest @params
        
        # Parse cookies from response
        if ($response.Headers["Set-Cookie"]) {
            $response.Headers["Set-Cookie"] | ForEach-Object {
                if ($_ -match "([^=]+)=([^;]+)") {
                    $cookies[$matches[1]] = $matches[2]
                }
            }
        }
        
        $data = $response.Content | ConvertFrom-Json
        
        return @{
            Status = $response.StatusCode
            Data = $data
            Ok = $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorContent = try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.ReadToEnd() | ConvertFrom-Json
        } catch {
            @{ error = $_.Exception.Message }
        }
        
        return @{
            Status = $statusCode
            Data = $errorContent
            Ok = $false
            Error = $_.Exception.Message
        }
    }
}

# Test 1: Backend Health Check
function Test-BackendHealth {
    Write-Host "`n📋 Test 1: Backend Health Check" -ForegroundColor Cyan
    try {
        $result = Invoke-WebRequest -Uri "$BASE_URL/healthz" -Method GET -ErrorAction Stop
        Log-Test "Backend Health Check" ($result.StatusCode -eq 200) "Status: $($result.StatusCode)"
        return $true
    } catch {
        Log-Test "Backend Health Check" $false "Backend not running: $($_.Exception.Message)"
        return $false
    }
}

# Test 2: User Registration
function Test-UserRegistration {
    Write-Host "`n📋 Test 2: User Registration" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/auth/register" -Body $TEST_USER -UseAuth $false
    
    if ($result.Status -eq 201 -or $result.Status -eq 200) {
        Log-Test "User Registration" $true "Status: $($result.Status)"
        if ($result.Data.access) {
            $script:accessToken = $result.Data.access
        }
        return $true
    } elseif ($result.Status -eq 400 -and ($result.Data.error -like "*already*" -or $result.Data.message -like "*already*")) {
        Log-Warning "User Registration" "User already exists, will try login instead"
        return $false
    } else {
        Log-Test "User Registration" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 3: User Login
function Test-UserLogin {
    Write-Host "`n📋 Test 3: User Login" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/auth/login" -Body @{
        email = $TEST_USER.email
        password = $TEST_USER.password
    } -UseAuth $false
    
    if ($result.Status -eq 200) {
        Log-Test "User Login" $true "Status: $($result.Status)"
        if ($result.Data.access) {
            $script:accessToken = $result.Data.access
        }
        $hasAccessCookie = $cookies.ContainsKey("ogc_access") -or $cookies.ContainsKey("ogc_access")
        $hasRefreshCookie = $cookies.ContainsKey("ogc_refresh") -or $cookies.ContainsKey("ogc_refresh")
        Log-Test "Access Cookie Set" $hasAccessCookie ($hasAccessCookie ? "Cookie found" : "Cookie not found")
        Log-Test "Refresh Cookie Set" $hasRefreshCookie ($hasRefreshCookie ? "Cookie found" : "Cookie not found")
        return $true
    } else {
        Log-Test "User Login" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 4: Wallet Summary
function Test-WalletSummary {
    Write-Host "`n📋 Test 4: Wallet Summary" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "GET" -Endpoint "/wallet"
    
    if ($result.Status -eq 200) {
        $requiredFields = @("balance", "staked", "rewards", "address", "updatedAt")
        $hasAllFields = $requiredFields | ForEach-Object { $result.Data.PSObject.Properties.Name -contains $_ } | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count
        $hasAllFields = $hasAllFields -eq 0
        
        Log-Test "Wallet Summary" $hasAllFields "Status: $($result.Status)"
        if ($hasAllFields) {
            Write-Host "   Balance: $($result.Data.balance), Staked: $($result.Data.staked), Rewards: $($result.Data.rewards)" -ForegroundColor Gray
        }
        return $hasAllFields
    } else {
        Log-Test "Wallet Summary" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 5: Demo Transactions
function Test-DemoTransactions {
    Write-Host "`n📋 Test 5: Demo Transactions Creation" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/wallet/demo-transactions"
    
    if ($result.Status -eq 200 -and $result.Data.ok -eq $true) {
        $inserted = if ($result.Data.inserted) { $result.Data.inserted } else { 5 }
        Log-Test "Demo Transactions" $true "Status: $($result.Status), Inserted: $inserted"
        return $true
    } else {
        Log-Test "Demo Transactions" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 6: List Transactions
function Test-ListTransactions {
    Write-Host "`n📋 Test 6: List Transactions" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "GET" -Endpoint "/wallet/transactions?page=1&pageSize=20"
    
    if ($result.Status -eq 200) {
        $hasItems = $result.Data.items -is [array]
        $hasPagination = $null -ne $result.Data.total -and $null -ne $result.Data.page -and $null -ne $result.Data.pageSize
        $itemCount = if ($hasItems) { $result.Data.items.Count } else { 0 }
        Log-Test "List Transactions" ($hasItems -and $hasPagination) "Status: $($result.Status), Items: $itemCount, Total: $($result.Data.total)"
        return ($hasItems -and $hasPagination)
    } else {
        Log-Test "List Transactions" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 7: Stake
function Test-Stake {
    Write-Host "`n📋 Test 7: Stake Operation" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/wallet/stake" -Body @{ amount = 1000 }
    
    if ($result.Status -eq 200 -and $result.Data.success -eq $true) {
        Log-Test "Stake Operation" $true "Status: $($result.Status)"
        return $true
    } else {
        Log-Test "Stake Operation" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 8: Unstake
function Test-Unstake {
    Write-Host "`n📋 Test 8: Unstake Operation" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/wallet/unstake" -Body @{ amount = 500 }
    
    if ($result.Status -eq 200 -and $result.Data.success -eq $true) {
        Log-Test "Unstake Operation" $true "Status: $($result.Status)"
        return $true
    } else {
        Log-Test "Unstake Operation" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 9: Transfer
function Test-Transfer {
    Write-Host "`n📋 Test 9: Transfer Operation" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "POST" -Endpoint "/wallet/transfer" -Body @{
        to = "0x1234567890abcdef"
        amount = 250
    }
    
    if ($result.Status -eq 200) {
        $hasTxId = $null -ne $result.Data.txId -or $null -ne $result.Data.tx_id
        $txId = if ($result.Data.txId) { $result.Data.txId } else { $result.Data.tx_id }
        Log-Test "Transfer Operation" $hasTxId "Status: $($result.Status), TX ID: $txId"
        return $hasTxId
    } else {
        Log-Test "Transfer Operation" $false "Status: $($result.Status), Error: $($result.Data | ConvertTo-Json -Compress)"
        return $false
    }
}

# Test 10: Final Balance Check
function Test-FinalBalance {
    Write-Host "`n📋 Test 10: Wallet Balance Verification" -ForegroundColor Cyan
    $result = Invoke-ApiCall -Method "GET" -Endpoint "/wallet"
    
    if ($result.Status -eq 200) {
        Write-Host "   Final Balance: $($result.Data.balance)" -ForegroundColor Gray
        Write-Host "   Final Staked: $($result.Data.staked)" -ForegroundColor Gray
        Write-Host "   Final Rewards: $($result.Data.rewards)" -ForegroundColor Gray
        Log-Test "Wallet Balance Verification" $true "Balance retrieved successfully"
        return $true
    } else {
        Log-Test "Wallet Balance Verification" $false "Status: $($result.Status)"
        return $false
    }
}

# Main test runner
function Start-Tests {
    Write-Host "🚀 Starting Wallet API Verification Tests" -ForegroundColor Magenta
    Write-Host "📍 Base URL: $BASE_URL" -ForegroundColor Gray
    Write-Host "📍 API Base: $API_BASE`n" -ForegroundColor Gray
    
    # Test 1: Health check
    $healthOk = Test-BackendHealth
    if (-not $healthOk) {
        Write-Host "`n❌ Backend is not running. Please start the backend first:" -ForegroundColor Red
        Write-Host "   cd backend" -ForegroundColor Yellow
        Write-Host "   npm start" -ForegroundColor Yellow
        exit 1
    }
    
    # Test 2 & 3: Auth
    $registered = Test-UserRegistration
    if (-not $registered) {
        Test-UserLogin | Out-Null
    }
    
    if (-not $accessToken) {
        Write-Host "`n❌ Authentication failed. Cannot proceed with wallet tests." -ForegroundColor Red
        exit 1
    }
    
    # Test 4-10: Wallet operations
    Test-WalletSummary | Out-Null
    Test-DemoTransactions | Out-Null
    Test-ListTransactions | Out-Null
    Test-Stake | Out-Null
    Test-Unstake | Out-Null
    Test-Transfer | Out-Null
    Test-FinalBalance | Out-Null
    
    # Summary
    Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
    Write-Host "📊 TEST SUMMARY" -ForegroundColor Magenta
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "✅ Passed: $($results.passed.Count)" -ForegroundColor Green
    Write-Host "❌ Failed: $($results.failed.Count)" -ForegroundColor Red
    Write-Host "⚠️  Warnings: $($results.warnings.Count)" -ForegroundColor Yellow
    
    if ($results.failed.Count -gt 0) {
        Write-Host "`n❌ Failed Tests:" -ForegroundColor Red
        $results.failed | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    }
    
    if ($results.warnings.Count -gt 0) {
        Write-Host "`n⚠️  Warnings:" -ForegroundColor Yellow
        $results.warnings | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    }
    
    Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
    
    if ($results.failed.Count -eq 0) {
        Write-Host "🎉 All tests passed!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Some tests failed. Please review the errors above." -ForegroundColor Red
        exit 1
    }
}

# Run tests
Start-Tests

