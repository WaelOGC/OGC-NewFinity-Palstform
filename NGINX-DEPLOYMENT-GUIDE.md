# Nginx Configuration Deployment Guide
## OGC NewFinity Platform

This guide provides complete instructions for deploying the Nginx configuration for the OGC NewFinity Platform.

---

## 📋 Configuration Overview

The Nginx configuration file (`nginx-finityplatform.cloud.conf`) includes:

### Server Blocks

1. **HTTP Server Block (Port 80)**
   - Redirects all HTTP traffic to HTTPS
   - Allows Let's Encrypt ACME challenges

2. **HTTPS Server Block (Port 443)**
   - Serves frontend from `/var/www/ogc-platform/frontend/dist`
   - Proxies `/api/*` to backend at `127.0.0.1:4000`
   - Handles React Router SPA routing
   - SSL/TLS with Certbot-managed certificates
   - Security headers and performance optimizations

---

## 🔧 Location Block Explanations

### 1. `location /api/`
**Purpose**: Proxy all API requests to the backend

- **Proxy Target**: `http://127.0.0.1:4000`
- **Handles**: 
  - `/api/v1/*` (main API routes)
  - `/api/status` (status endpoint)
  - `/api/health` (health check endpoint)
- **Headers**: Preserves original request information (Host, IP, Protocol)
- **Caching**: Disabled (no-cache headers)
- **Timeouts**: 60 seconds for connect, send, and read

### 2. `location /`
**Purpose**: Serve frontend SPA with React Router fallback

- **Root**: `/var/www/ogc-platform/frontend/dist`
- **Fallback**: `try_files $uri $uri/ /index.html`
- **Behavior**: 
  - First tries to serve the requested file
  - If not found, tries as a directory
  - If still not found, serves `index.html` (allowing React Router to handle routing)

### 3. `location ~* \.(js|css|png|jpg|...)`
**Purpose**: Cache static assets with long expiration

- **Expiration**: 1 year
- **Cache-Control**: `public, immutable`
- **Assets**: JS, CSS, images, fonts
- **Logging**: Disabled for performance

### 4. `location ~ /\.`
**Purpose**: Deny access to hidden files

- **Security**: Prevents access to `.htaccess`, `.env`, etc.
- **Logging**: Disabled

---

## 📦 Deployment Steps

### Step 1: Backup Existing Configuration (if any)

```bash
# Backup existing config if it exists
sudo cp /etc/nginx/sites-available/finityplatform.cloud /etc/nginx/sites-available/finityplatform.cloud.backup
```

### Step 2: Copy Configuration File

```bash
# Copy the configuration file to Nginx sites-available
sudo cp nginx-finityplatform.cloud.conf /etc/nginx/sites-available/finityplatform.cloud

# Verify the file was copied correctly
sudo cat /etc/nginx/sites-available/finityplatform.cloud
```

### Step 3: Create Symbolic Link (if not exists)

```bash
# Enable the site by creating a symbolic link
sudo ln -sf /etc/nginx/sites-available/finityplatform.cloud /etc/nginx/sites-enabled/finityplatform.cloud

# Verify the link exists
ls -la /etc/nginx/sites-enabled/ | grep finityplatform
```

### Step 4: Remove Default Site (Optional)

```bash
# Remove default Nginx site if it conflicts
sudo rm /etc/nginx/sites-enabled/default
```

### Step 5: Test Nginx Configuration

```bash
# Test the configuration for syntax errors
sudo nginx -t
```

**Expected Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If errors occur:**
- Check the error message
- Verify file paths are correct
- Ensure all brackets are closed
- Check for typos in directive names

### Step 6: Set Up SSL with Certbot (First Time Only)

If SSL certificates don't exist yet:

```bash
# Install Certbot if not already installed
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d finityplatform.cloud -d www.finityplatform.cloud

# Certbot will:
# 1. Verify domain ownership
# 2. Obtain SSL certificates
# 3. Automatically update the Nginx config with SSL paths
# 4. Set up automatic renewal
```

**Note**: Certbot will modify the config file. After running, verify the SSL paths are correct.

### Step 7: Verify Frontend Build Exists

```bash
# Check if frontend build directory exists
ls -la /var/www/ogc-platform/frontend/dist/

# If it doesn't exist, build the frontend:
cd /var/www/ogc-platform/frontend
npm install --production=false
npm run build
```

### Step 8: Verify Backend is Running

```bash
# Check if backend is running on PM2
pm2 status ogc-backend

# If not running, start it:
cd /var/www/ogc-platform/backend
pm2 start npm --name "ogc-backend" -- run prod

# Test backend directly
curl http://127.0.0.1:4000/api/status
```

### Step 9: Set Proper Permissions

```bash
# Ensure Nginx can read the frontend files
sudo chown -R www-data:www-data /var/www/ogc-platform/frontend/dist
sudo chmod -R 755 /var/www/ogc-platform/frontend/dist
```

### Step 10: Reload Nginx

```bash
# Reload Nginx to apply changes
sudo systemctl reload nginx

# Or restart if reload doesn't work
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## ✅ Verification Checklist

### 1. Configuration Syntax

```bash
sudo nginx -t
```
**Expected**: No syntax errors

### 2. Nginx Service Status

```bash
sudo systemctl status nginx
```
**Expected**: `active (running)`

### 3. Backend Direct Connection

```bash
curl http://127.0.0.1:4000/api/status
curl http://127.0.0.1:4000/api/health
```
**Expected**: JSON responses with status information

### 4. API Through Nginx (HTTPS)

```bash
curl https://finityplatform.cloud/api/status
curl https://finityplatform.cloud/api/health
```
**Expected**: JSON responses (same as direct connection)

### 5. Frontend Homepage

```bash
curl -I https://finityplatform.cloud/
```
**Expected**: `200 OK` status, `Content-Type: text/html`

### 6. Frontend Assets

```bash
curl -I https://finityplatform.cloud/assets/index-*.js
```
**Expected**: `200 OK` status, proper caching headers

### 7. SPA Routing

```bash
curl -I https://finityplatform.cloud/login
curl -I https://finityplatform.cloud/wallet
```
**Expected**: `200 OK` status (serves index.html, React Router handles routing)

### 8. HTTP to HTTPS Redirect

```bash
curl -I http://finityplatform.cloud/
```
**Expected**: `301 Moved Permanently`, `Location: https://finityplatform.cloud/`

### 9. SSL Certificate

```bash
openssl s_client -connect finityplatform.cloud:443 -servername finityplatform.cloud < /dev/null 2>/dev/null | openssl x509 -noout -dates
```
**Expected**: Valid certificate with future expiration date

### 10. Browser Test

1. Open `https://finityplatform.cloud/` in browser
2. Check browser console for errors
3. Verify SystemStatusBadge shows backend status
4. Test navigation (e.g., `/login`, `/wallet`)
5. Verify API calls work (check Network tab)

---

## 🔍 Troubleshooting

### Issue: Nginx fails to start

**Check:**
```bash
sudo nginx -t
sudo journalctl -u nginx -n 50
```

**Common causes:**
- Syntax errors in config file
- Port 80 or 443 already in use
- Missing SSL certificates (if HTTPS block is enabled)
- Incorrect file paths

### Issue: 502 Bad Gateway

**Check:**
```bash
# Verify backend is running
pm2 status ogc-backend

# Test backend directly
curl http://127.0.0.1:4000/api/status

# Check Nginx error logs
sudo tail -f /var/log/nginx/finityplatform.cloud.error.log
```

**Common causes:**
- Backend not running
- Backend listening on wrong host/port
- Firewall blocking localhost connections

### Issue: 404 Not Found for Frontend

**Check:**
```bash
# Verify build directory exists
ls -la /var/www/ogc-platform/frontend/dist/

# Check permissions
ls -la /var/www/ogc-platform/frontend/dist/index.html

# Verify Nginx can read files
sudo -u www-data cat /var/www/ogc-platform/frontend/dist/index.html
```

**Common causes:**
- Frontend not built
- Incorrect root path in config
- Permission issues

### Issue: SPA Routes Return 404

**Check:**
- Verify `try_files $uri $uri/ /index.html;` is in the `/` location block
- Ensure the `/` location block comes AFTER `/api/` location block
- Check that `index.html` exists in the dist directory

### Issue: SSL Certificate Errors

**Check:**
```bash
# Verify certificates exist
sudo ls -la /etc/letsencrypt/live/finityplatform.cloud/

# Test certificate renewal
sudo certbot renew --dry-run
```

**Common causes:**
- Certificates not obtained yet
- Certificates expired
- Incorrect certificate paths in config

---

## 🔄 Updating Configuration

### After Making Changes

1. **Edit the config file:**
   ```bash
   sudo nano /etc/nginx/sites-available/finityplatform.cloud
   ```

2. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

3. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

### After Frontend Updates

1. **Rebuild frontend:**
   ```bash
   cd /var/www/ogc-platform/frontend
   npm run build
   ```

2. **No Nginx reload needed** (files are served directly from disk)

### After Backend Updates

1. **Restart backend:**
   ```bash
   pm2 restart ogc-backend
   ```

2. **No Nginx reload needed** (proxy target doesn't change)

---

## 📊 Performance Optimizations

The configuration includes:

- **Gzip Compression**: Enabled for text-based files
- **Static Asset Caching**: 1-year expiration for JS/CSS/images
- **HTTP/2**: Enabled for better performance
- **Buffer Optimization**: Proper proxy buffer settings

---

## 🔒 Security Features

The configuration includes:

- **HTTPS Enforcement**: HTTP to HTTPS redirect
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Hidden File Protection**: Denies access to `.` files
- **SSL/TLS**: Modern SSL configuration via Certbot

---

## 📝 Maintenance

### Regular Tasks

1. **Monitor Logs:**
   ```bash
   sudo tail -f /var/log/nginx/finityplatform.cloud.error.log
   sudo tail -f /var/log/nginx/finityplatform.cloud.access.log
   ```

2. **Check SSL Certificate Expiration:**
   ```bash
   sudo certbot certificates
   ```

3. **Test Certificate Renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

4. **Rotate Logs** (if needed):
   ```bash
   sudo logrotate -f /etc/logrotate.d/nginx
   ```

---

## 🎯 Quick Reference Commands

```bash
# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/finityplatform.cloud.error.log

# View access logs
sudo tail -f /var/log/nginx/finityplatform.cloud.access.log

# Test API endpoint
curl https://finityplatform.cloud/api/status

# Test frontend
curl -I https://finityplatform.cloud/
```

---

## ✨ Final Notes

- The configuration is production-ready and follows Nginx best practices
- All paths are relative to the VPS deployment structure
- SSL certificates are managed by Certbot with automatic renewal
- The configuration supports both `finityplatform.cloud` and `www.finityplatform.cloud`
- React Router SPA routing is fully supported
- API proxy is configured with proper headers and timeouts

**The Nginx configuration is verified and ready for production deployment.**

