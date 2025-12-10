# Windows MySQL Setup Guide

## Detecting MySQL Installation

If the `mysql` command is not found in your terminal, MySQL may not be in your system PATH.

### Method 1: Find MySQL Installation Path

**Common MySQL Installation Locations on Windows:**

1. **MySQL Server (Standalone):**
   - `C:\Program Files\MySQL\MySQL Server 8.0\bin`
   - `C:\Program Files\MySQL\MySQL Server 8.1\bin`
   - `C:\Program Files\MySQL\MySQL Server 8.2\bin`

2. **XAMPP:**
   - `C:\xampp\mysql\bin`

3. **WAMP:**
   - `C:\wamp64\bin\mysql\mysql8.0.xx\bin`

4. **MAMP:**
   - `C:\MAMP\bin\mysql\bin`

5. **Custom Installation:**
   - Check your MySQL installation directory

### Method 2: Search for MySQL Installation

**PowerShell:**
```powershell
# Search for mysql.exe
Get-ChildItem -Path "C:\Program Files" -Filter "mysql.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName

# Or search in common locations
$paths = @(
    "C:\Program Files\MySQL",
    "C:\xampp\mysql\bin",
    "C:\wamp64\bin\mysql",
    "C:\MAMP\bin\mysql"
)
foreach ($path in $paths) {
    if (Test-Path "$path\bin\mysql.exe") {
        Write-Host "Found MySQL at: $path\bin"
    }
}
```

**Command Prompt:**
```cmd
dir /s /b C:\Program Files\MySQL\mysql.exe
dir /s /b C:\xampp\mysql\bin\mysql.exe
```

### Method 3: Check Windows Services

1. Press `Win + R`, type `services.msc`, press Enter
2. Look for "MySQL" services
3. Right-click → Properties → Check "Path to executable"
4. The bin folder will be one level up from the executable

## Adding MySQL to PATH

### Option 1: Temporary (Current Session Only)

**PowerShell:**
```powershell
# Replace with your actual MySQL bin path
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

**Command Prompt:**
```cmd
set PATH=%PATH%;C:\Program Files\MySQL\MySQL Server 8.0\bin
```

### Option 2: Permanent (User PATH)

1. Press `Win + X` → System → Advanced system settings
2. Click "Environment Variables"
3. Under "User variables", select "Path" → Click "Edit"
4. Click "New" → Add your MySQL bin path (e.g., `C:\Program Files\MySQL\MySQL Server 8.0\bin`)
5. Click "OK" on all dialogs
6. **Restart your terminal/PowerShell** for changes to take effect

**PowerShell (Automated):**
```powershell
# Replace with your actual MySQL bin path
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;$mysqlPath", "User")
Write-Host "MySQL added to PATH. Please restart your terminal."
```

### Option 3: Permanent (System PATH - Requires Admin)

1. Press `Win + X` → System → Advanced system settings
2. Click "Environment Variables"
3. Under "System variables", select "Path" → Click "Edit"
4. Click "New" → Add your MySQL bin path
5. Click "OK" on all dialogs
6. **Restart your terminal/PowerShell** for changes to take effect

## Verifying MySQL is in PATH

**PowerShell/Command Prompt:**
```powershell
mysql --version
```

**Expected Output:**
```
mysql  Ver 8.0.xx for Win64 on x86_64 (MySQL Community Server - GPL)
```

If you see version information, MySQL is correctly configured in PATH.

## Alternative: Use Full Path

If you don't want to modify PATH, you can use the full path to MySQL:

**PowerShell:**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

**Command Prompt:**
```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

## Testing Database Connection

Once MySQL is accessible, test the connection:

```powershell
mysql -u root -p -e "SHOW DATABASES;"
```

Or connect to your database:

```powershell
mysql -u root -p ogc_newfinity -e "SHOW TABLES;"
```

## Troubleshooting

### "mysql: command not found"
- MySQL is not in PATH
- Follow the steps above to add MySQL to PATH
- Or use the full path to mysql.exe

### "Access denied for user"
- Check your `.env` file has correct `DB_USER` and `DB_PASSWORD`
- Verify MySQL user has proper permissions

### "Can't connect to MySQL server"
- Ensure MySQL service is running:
  ```powershell
  Get-Service | Where-Object {$_.Name -like "*mysql*"}
  ```
- Start MySQL service if stopped:
  ```powershell
  Start-Service MySQL80  # Replace with your MySQL service name
  ```
- Check `DB_HOST` and `DB_PORT` in `.env` file

### Port Already in Use
- Check if MySQL is already running on port 3306:
  ```powershell
  netstat -ano | findstr :3306
  ```
- If another process is using the port, either:
  - Stop that process
  - Change MySQL port in `my.ini` (MySQL config file)
  - Update `DB_PORT` in `.env` file

