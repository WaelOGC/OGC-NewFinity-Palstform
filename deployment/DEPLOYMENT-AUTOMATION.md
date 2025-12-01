# OGC NewFinity Platform - Deployment Automation Guide

## 📋 Overview

This document describes the complete deployment automation system for the OGC NewFinity Platform. All scripts are designed to be **safe**, **modular**, and **production-ready**, giving you complete manual control over deployment processes.

---

## 📁 Folder Structure

```
/var/www/ogc-platform/
├── backend/              # Backend application
├── frontend/             # Frontend application
├── scripts/              # Deployment scripts
│   ├── deploy-backend.sh
│   ├── deploy-frontend.sh
│   ├── restart-all.sh
│   ├── health-check.sh
│   ├── nginx-test.sh
│   └── rollback-backend.sh
└── deployment/          # Documentation
    └── DEPLOYMENT-AUTOMATION.md
```

---

## 🚀 Deployment Scripts

### 1. `deploy-backend.sh`

**Purpose:** Automates backend deployment with Git pull, dependency installation, Prisma migrations, and PM2 restart.

**Usage:**
```bash
cd /var/www/ogc-platform
bash scripts/deploy-backend.sh
```

**What it does:**
1. ✅ Pulls latest code from Git (main branch)
2. ✅ Installs backend dependencies (`npm install`)
3. ✅ Generates Prisma Client (if Prisma exists)
4. ✅ Applies Prisma migrations (`prisma migrate deploy`)
5. ✅ Restarts backend with PM2
6. ✅ Validates backend endpoints (`/api/status`, `/api/health`)

**Expected Output:**
```
========================================
🚀 BACKEND DEPLOYMENT STARTED
========================================

📥 STEP 1: Pulling latest code from Git...
✅ Code pulled successfully

📦 STEP 2: Installing backend dependencies...
✅ Dependencies installed successfully

🗄️  STEP 3: Applying Prisma migrations...
✅ Prisma Client generated
✅ Prisma migrations applied successfully

🔄 STEP 4: Restarting backend with PM2...
✅ Backend restarted successfully

🔍 STEP 5: Validating backend is online...
✅ Backend status endpoint is responding
✅ Backend health endpoint is responding

========================================
✅ BACKEND DEPLOYMENT COMPLETED
========================================
```

**Troubleshooting:**
- **Git pull fails:** Check network connection and Git credentials
- **npm install fails:** Check Node.js version and disk space
- **Prisma migration fails:** Review migration files and database connection
- **PM2 restart fails:** Check PM2 app name and process status
- **Validation fails:** Check backend logs with `pm2 logs ogc-backend`

---

### 2. `deploy-frontend.sh`

**Purpose:** Automates frontend deployment with Git pull, dependency installation, and Vite build.

**Usage:**
```bash
cd /var/www/ogc-platform
bash scripts/deploy-frontend.sh
```

**What it does:**
1. ✅ Pulls latest code from Git (main branch)
2. ✅ Installs frontend dependencies (`npm install`)
3. ✅ Removes old `dist/` folder
4. ✅ Builds frontend with Vite (`npm run build`)
5. ✅ Validates `dist/` folder exists and contains `index.html`

**Expected Output:**
```
========================================
🚀 FRONTEND DEPLOYMENT STARTED
========================================

📥 STEP 1: Pulling latest code from Git...
✅ Code pulled successfully

📦 STEP 2: Installing frontend dependencies...
✅ Dependencies installed successfully

🏗️  STEP 3: Building frontend with Vite...
✅ Frontend build completed successfully

🔍 STEP 4: Validating dist/ folder...
✅ dist/ folder validated (42 files found)
Dist folder size: 2.3M

========================================
✅ FRONTEND DEPLOYMENT COMPLETED
========================================
```

**Troubleshooting:**
- **Build fails:** Check for TypeScript/JavaScript errors in console output
- **dist/ folder missing:** Verify Vite build completed without errors
- **Nginx not serving new build:** Restart Nginx after deployment

---

### 3. `restart-all.sh`

**Purpose:** Restarts all platform services (Nginx and PM2 apps) and displays status.

**Usage:**
```bash
cd /var/www/ogc-platform
bash scripts/restart-all.sh
```

**What it does:**
1. ✅ Tests Nginx configuration (`nginx -t`)
2. ✅ Reloads Nginx (graceful restart)
3. ✅ Restarts all PM2 apps
4. ✅ Displays service status

**Expected Output:**
```
========================================
🔄 RESTARTING ALL SERVICES
========================================

🌐 STEP 1: Restarting Nginx...
✅ Nginx configuration is valid
✅ Nginx reloaded successfully

🔄 STEP 2: Restarting all PM2 apps...
✅ All PM2 apps restarted successfully

========================================
📊 SERVER STATUS
========================================

Nginx Status:
✅ Nginx is running

PM2 Apps Status:
┌─────┬──────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ status  │ restart │ uptime   │
├─────┼──────────────┼─────────┼─────────┼──────────┤
│ 0   │ ogc-backend  │ online  │ 0       │ 5s       │
└─────┴──────────────┴─────────┴─────────┴──────────┘
```

**Troubleshooting:**
- **Nginx test fails:** Run `scripts/nginx-test.sh` for detailed errors
- **PM2 restart fails:** Check PM2 process list with `pm2 list`

---

### 4. `health-check.sh`

**Purpose:** Performs comprehensive health checks on all platform endpoints and services.

**Usage:**
```bash
# Human-readable output
cd /var/www/ogc-platform
bash scripts/health-check.sh

# JSON output (for monitoring tools)
bash scripts/health-check.sh --json
```

**What it checks:**
1. ✅ Backend `/api/status` endpoint
2. ✅ Backend `/api/health` endpoint
3. ✅ Frontend root `/` availability
4. ✅ Nginx process status
5. ✅ PM2 apps count

**Expected Output (Human-readable):**
```
========================================
🏥 HEALTH CHECK
========================================

✅ backend_status: OK (200, 0.023s)
✅ backend_health: OK (200, 0.015s)
✅ frontend_root: OK (200, 0.012s)
✅ nginx process: RUNNING
✅ PM2 apps: 1 running

========================================
✅ ALL CHECKS PASSED
========================================
```

**Expected Output (JSON):**
```json
{
  "backend_status": {"status":"ok","code":200,"response_time":0.023},
  "backend_health": {"status":"ok","code":200,"response_time":0.015},
  "frontend_root": {"status":"ok","code":200,"response_time":0.012},
  "nginx_process": {"status":"ok"},
  "pm2_apps": {"count":1}
}
```

**Exit Codes:**
- `0` - All checks passed
- `1` - One or more checks failed

**Troubleshooting:**
- **Backend endpoints fail:** Check backend logs and PM2 status
- **Frontend fails:** Check Nginx configuration and dist/ folder
- **Process checks fail:** Verify services are running

---

### 5. `nginx-test.sh`

**Purpose:** Validates Nginx configuration syntax before applying changes.

**Usage:**
```bash
cd /var/www/ogc-platform
bash scripts/nginx-test.sh
```

**What it does:**
1. ✅ Runs `sudo nginx -t` to test configuration
2. ✅ Displays detailed output
3. ✅ Returns appropriate exit code

**Expected Output (Success):**
```
========================================
🔍 NGINX CONFIGURATION TEST
========================================

Running: sudo nginx -t

nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful

========================================
✅ NGINX CONFIGURATION IS VALID
========================================
```

**Expected Output (Failure):**
```
========================================
🔍 NGINX CONFIGURATION TEST
========================================

Running: sudo nginx -t

nginx: [emerg] unexpected "}" in /etc/nginx/sites-enabled/finityplatform.cloud:45
nginx: configuration file /etc/nginx/nginx.conf test failed

========================================
❌ NGINX CONFIGURATION TEST FAILED
========================================

Troubleshooting steps:
1. Check the error messages above
2. Verify syntax in your Nginx configuration files
3. Check file permissions and paths
4. Ensure all referenced files exist
```

**Troubleshooting:**
- **Syntax errors:** Review the error message and line number
- **File not found:** Verify all referenced paths exist
- **Permission errors:** Check file ownership and permissions

---

### 6. `rollback-backend.sh`

**Purpose:** Rolls back backend to a previous Git commit version.

**Usage:**
```bash
cd /var/www/ogc-platform
bash scripts/rollback-backend.sh HEAD~1

# Or rollback to specific commit
bash scripts/rollback-backend.sh abc1234
```

**What it does:**
1. ✅ Shows recent Git commit history
2. ✅ Validates target commit exists
3. ✅ Prompts for confirmation
4. ✅ Resets code to target commit
5. ✅ Reinstalls dependencies
6. ✅ Regenerates Prisma Client (if needed)
7. ✅ Restarts backend with PM2
8. ✅ Validates endpoints

**Expected Output:**
```
========================================
⏪ BACKEND ROLLBACK
========================================

📜 Recent Git commits:
abc1234 Fix authentication bug
def5678 Add new feature
ghi9012 Update dependencies

Current commit: abc1234
Target commit:  def5678

Target commit message:
Add new feature

Are you sure you want to rollback to this commit? (yes/no): yes

⏪ STEP 1: Rolling back code to def5678...
✅ Code rolled back successfully

📦 STEP 2: Reinstalling dependencies...
✅ Dependencies reinstalled

🔄 STEP 3: Restarting backend with PM2...
✅ Backend restarted successfully

🔍 STEP 4: Validating backend endpoints...
✅ Backend status endpoint is responding
✅ Backend health endpoint is responding

========================================
✅ ROLLBACK COMPLETED SUCCESSFULLY
========================================
```

**Safety Notes:**
- ⚠️ **This script performs a hard Git reset** - local changes will be lost
- ⚠️ **Always backup before rollback** if you have uncommitted changes
- ⚠️ **Database migrations are NOT rolled back** - only code is reverted

**Troubleshooting:**
- **Invalid commit:** Verify commit hash exists with `git log`
- **Dependencies fail:** Check Node.js version compatibility
- **Validation fails:** Review PM2 logs for errors

---

## 🔧 Common Deployment Workflows

### Full Platform Deployment

```bash
# 1. Deploy backend
bash scripts/deploy-backend.sh

# 2. Deploy frontend
bash scripts/deploy-frontend.sh

# 3. Restart all services
bash scripts/restart-all.sh

# 4. Verify health
bash scripts/health-check.sh
```

### Backend-Only Update

```bash
# 1. Deploy backend
bash scripts/deploy-backend.sh

# 2. Verify health
bash scripts/health-check.sh
```

### Frontend-Only Update

```bash
# 1. Deploy frontend
bash scripts/deploy-frontend.sh

# 2. Restart Nginx (if needed)
sudo systemctl reload nginx

# 3. Verify health
bash scripts/health-check.sh
```

### Emergency Rollback

```bash
# 1. Rollback backend
bash scripts/rollback-backend.sh HEAD~1

# 2. Verify health
bash scripts/health-check.sh
```

---

## 📊 Log Inspection

### PM2 Logs

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs ogc-backend

# View last 100 lines
pm2 logs ogc-backend --lines 100

# Follow logs in real-time
pm2 logs ogc-backend --follow
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/finityplatform.cloud.access.log

# Error logs
sudo tail -f /var/log/nginx/finityplatform.cloud.error.log

# All logs
sudo tail -f /var/log/nginx/*.log
```

### System Logs

```bash
# System service logs
sudo journalctl -u nginx -f

# PM2 service logs
sudo journalctl -u pm2 -f
```

---

## 🛡️ Safety Features

All scripts include the following safety measures:

1. **`set -e`** - Scripts exit immediately on any error
2. **Path validation** - Checks for required directories before execution
3. **Git validation** - Verifies Git operations succeed
4. **Process validation** - Checks PM2 and Nginx status
5. **Endpoint validation** - Verifies services are responding
6. **No destructive operations** - Scripts never delete critical files
7. **Manual confirmation** - Rollback script requires explicit confirmation

---

## 📝 Backup Recommendations

### Before Deployment

1. **Backup database** (if using database):
   ```bash
   # Example for PostgreSQL
   pg_dump -U username database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Backup code** (Git already provides this):
   ```bash
   git tag backup-$(date +%Y%m%d_%H%M%S)
   git push origin --tags
   ```

3. **Backup environment files**:
   ```bash
   cp backend/.env backend/.env.backup
   ```

### Before Rollback

1. **Create a backup tag**:
   ```bash
   git tag rollback-backup-$(date +%Y%m%d_%H%M%S)
   ```

2. **Document current state**:
   ```bash
   pm2 list > pm2_state_backup.txt
   ```

---

## 🔍 Troubleshooting Guide

### Backend Not Starting

1. Check PM2 status: `pm2 list`
2. Check logs: `pm2 logs ogc-backend`
3. Verify environment variables: `cat backend/.env`
4. Check port availability: `netstat -tulpn | grep 4000`
5. Verify Node.js version: `node --version`

### Frontend Not Updating

1. Verify build completed: `ls -la frontend/dist/`
2. Check Nginx configuration: `bash scripts/nginx-test.sh`
3. Verify Nginx root path matches dist folder
4. Clear browser cache
5. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Nginx Configuration Issues

1. Test configuration: `bash scripts/nginx-test.sh`
2. Check file permissions: `ls -la /etc/nginx/sites-enabled/`
3. Verify SSL certificates exist (if using HTTPS)
4. Check Nginx error logs for specific errors

### Health Checks Failing

1. Run health check with details: `bash scripts/health-check.sh`
2. Check individual endpoints manually:
   ```bash
   curl http://127.0.0.1:4000/api/status
   curl http://127.0.0.1:4000/api/health
   curl http://127.0.0.1/
   ```
3. Verify services are running: `systemctl status nginx` and `pm2 list`

---

## 📚 Additional Resources

### PM2 Commands

```bash
# List all apps
pm2 list

# Start app
pm2 start app.js --name ogc-backend

# Stop app
pm2 stop ogc-backend

# Restart app
pm2 restart ogc-backend

# Delete app
pm2 delete ogc-backend

# Monitor apps
pm2 monit

# Save process list
pm2 save

# Resurrect saved processes
pm2 resurrect
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload (graceful)
sudo systemctl reload nginx

# Restart (full)
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View configuration
sudo nginx -T
```

### Git Commands

```bash
# View commit history
git log --oneline -20

# View specific commit
git show <commit-hash>

# Create backup tag
git tag backup-$(date +%Y%m%d)

# View all tags
git tag -l
```

---

## ⚠️ Important Notes

1. **All scripts assume project root is `/var/www/ogc-platform`** - adjust paths if different
2. **Scripts require appropriate permissions** - some operations need `sudo`
3. **Git operations assume `main` branch** - adjust if using different branch
4. **PM2 app name is `ogc-backend`** - adjust if using different name
5. **Backend port is `4000`** - adjust if using different port
6. **Scripts are idempotent** - safe to run multiple times
7. **No automatic backups** - always backup before major changes

---

## 🎯 Quick Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy-backend.sh` | Deploy backend | After backend code changes |
| `deploy-frontend.sh` | Deploy frontend | After frontend code changes |
| `restart-all.sh` | Restart services | After config changes or issues |
| `health-check.sh` | Check system health | Regular monitoring or troubleshooting |
| `nginx-test.sh` | Test Nginx config | Before applying Nginx changes |
| `rollback-backend.sh` | Rollback backend | When backend has critical issues |

---

## 📞 Support

For issues or questions:
1. Check logs first (PM2 and Nginx)
2. Run health checks to identify problems
3. Review this documentation
4. Check project documentation in `/docs` folder

---

**Last Updated:** 2024
**Version:** 1.0.0

