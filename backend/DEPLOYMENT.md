# Backend Deployment (Production)

This document describes the steps to deploy the OGC NewFinity backend for production on the VPS using PM2.

## Prerequisites

- Node.js and npm installed on the VPS
- PM2 installed globally: `npm install -g pm2`
- Git repository cloned at `/var/www/ogc-platform`
- Environment variables configured (see Environment Variables section)
- Database configured and migrations applied

## Production Configuration

The backend is configured for production:

- **Host**: `127.0.0.1` (localhost only - not exposed to external network)
- **Port**: `4000` (default, can be overridden with `PORT` environment variable)
- **Process Manager**: PM2
- **Environment**: `NODE_ENV=production`

## Initial Deployment

### 1. Install Dependencies

```bash
cd /var/www/ogc-platform/backend
npm install --production
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd /var/www/ogc-platform/backend
nano .env
```

Required environment variables:

```env
# Server Configuration
NODE_ENV=production
PORT=4000

# CORS Configuration
CORS_ORIGIN=https://finityplatform.cloud,https://www.finityplatform.cloud

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ogc_newfinity

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Security Note**: Never commit `.env` files to Git. Use secure methods to manage secrets in production.

### 3. Run Database Migrations

```bash
cd /var/www/ogc-platform/backend
npm run prisma:deploy
```

### 4. Start Backend with PM2

```bash
cd /var/www/ogc-platform/backend
pm2 start npm --name "ogc-backend" -- run prod
```

Or using the start script directly:

```bash
cd /var/www/ogc-platform/backend
pm2 start src/index.js --name "ogc-backend" --interpreter node --env production
```

### 5. Save PM2 Configuration

After starting, save the PM2 process list so it restarts on server reboot:

```bash
pm2 save
pm2 startup
```

Follow the instructions provided by `pm2 startup` to enable automatic startup on system boot.

## PM2 Management Commands

### Check Status

```bash
pm2 status
pm2 status ogc-backend
```

### View Logs

```bash
# Real-time logs
pm2 logs ogc-backend

# Last 100 lines
pm2 logs ogc-backend --lines 100

# Error logs only
pm2 logs ogc-backend --err

# Output logs only
pm2 logs ogc-backend --out
```

### Restart Backend

```bash
# Restart the backend
pm2 restart ogc-backend

# Restart with zero downtime (graceful reload)
pm2 reload ogc-backend
```

### Stop Backend

```bash
pm2 stop ogc-backend
```

### Delete from PM2

```bash
pm2 delete ogc-backend
```

### Monitor Performance

```bash
# Real-time monitoring
pm2 monit

# Show detailed process information
pm2 show ogc-backend
```

## Updating the Backend

### Git Pull and Restart Workflow

When pulling new changes from the repository:

```bash
# Navigate to project root
cd /var/www/ogc-platform

# Pull latest changes
git pull origin main

# Navigate to backend directory
cd backend

# Install any new dependencies
npm install --production

# Run database migrations if needed
npm run prisma:deploy

# Restart the backend with PM2
pm2 restart ogc-backend

# Check status
pm2 status ogc-backend
pm2 logs ogc-backend --lines 50
```

### Quick Update Script

You can create a simple update script at `/var/www/ogc-platform/backend/update.sh`:

```bash
#!/bin/bash
cd /var/www/ogc-platform
git pull origin main
cd backend
npm install --production
npm run prisma:deploy
pm2 restart ogc-backend
pm2 logs ogc-backend --lines 20
```

Make it executable:

```bash
chmod +x /var/www/ogc-platform/backend/update.sh
```

Then run updates with:

```bash
/var/www/ogc-platform/backend/update.sh
```

## Environment Variables

### Required Variables

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (default: 4000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `CORS_ORIGIN`: Comma-separated list of allowed origins

### Optional Variables

- `JWT_EXPIRES_IN`: JWT token expiration time (default: 7d)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

### Loading Environment Variables

The backend uses `dotenv` to load environment variables from `.env` file. Make sure the `.env` file exists in the `backend/` directory.

## API Endpoints

### Status Endpoint

```bash
GET /status
GET /api/status
```

Returns:
```json
{
  "status": "ok",
  "service": "ogc-backend",
  "uptime": 12345.67,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Health Endpoint

```bash
GET /health
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "checks": {
    "backend": "up"
  },
  "version": "1.0.0",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

## Verification

After deployment, verify the backend is working:

### 1. Check PM2 Status

```bash
pm2 status ogc-backend
```

Should show status as `online`.

### 2. Test Status Endpoint

```bash
curl http://127.0.0.1:4000/status
curl http://127.0.0.1:4000/api/status
```

Should return JSON with status information.

### 3. Test Health Endpoint

```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/api/health
```

Should return JSON with health information.

### 4. Check Logs

```bash
pm2 logs ogc-backend --lines 50
```

Should show no errors and confirm the server is listening on `127.0.0.1:4000`.

### 5. Test Through Nginx

If Nginx is configured to proxy `/api/*` to the backend:

```bash
curl https://finityplatform.cloud/api/status
curl https://finityplatform.cloud/api/health
```

Should return JSON responses.

## Troubleshooting

### Backend Won't Start

1. **Check PM2 logs**:
   ```bash
   pm2 logs ogc-backend --err
   ```

2. **Check if port is in use**:
   ```bash
   netstat -tulpn | grep 4000
   lsof -i :4000
   ```

3. **Verify environment variables**:
   ```bash
   cd /var/www/ogc-platform/backend
   cat .env
   ```

4. **Check Node.js version**:
   ```bash
   node --version
   ```

5. **Test manually**:
   ```bash
   cd /var/www/ogc-platform/backend
   npm run start
   ```

### Backend Crashes

1. **Check PM2 logs for errors**:
   ```bash
   pm2 logs ogc-backend --err --lines 100
   ```

2. **Check system resources**:
   ```bash
   pm2 monit
   df -h  # Check disk space
   free -h  # Check memory
   ```

3. **Check database connection**:
   ```bash
   cd /var/www/ogc-platform/backend
   npm run prisma:studio
   ```

4. **Review recent changes**:
   ```bash
   cd /var/www/ogc-platform
   git log --oneline -10
   ```

### API Endpoints Not Responding

1. **Verify backend is running**:
   ```bash
   pm2 status ogc-backend
   ```

2. **Test direct connection**:
   ```bash
   curl http://127.0.0.1:4000/status
   ```

3. **Check Nginx configuration** (if using proxy):
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Verify CORS configuration**:
   Check that `CORS_ORIGIN` in `.env` includes your frontend domain.

### Database Connection Issues

1. **Test database connection**:
   ```bash
   cd /var/www/ogc-platform/backend
   npm run prisma:studio
   ```

2. **Verify DATABASE_URL**:
   ```bash
   grep DATABASE_URL .env
   ```

3. **Check PostgreSQL service**:
   ```bash
   sudo systemctl status postgresql
   ```

4. **Run migrations**:
   ```bash
   npm run prisma:deploy
   ```

## Logging and Monitoring

### PM2 Logs Location

PM2 logs are stored in:
- `~/.pm2/logs/ogc-backend-out.log` - Standard output
- `~/.pm2/logs/ogc-backend-error.log` - Error output

### View Logs

```bash
# Real-time logs
pm2 logs ogc-backend

# Last 100 lines
pm2 logs ogc-backend --lines 100

# Follow logs (like tail -f)
pm2 logs ogc-backend --lines 0
```

### Log Rotation

PM2 automatically rotates logs. To manually flush logs:

```bash
pm2 flush ogc-backend
```

### Monitoring

Use PM2's built-in monitoring:

```bash
pm2 monit
```

This shows:
- CPU usage
- Memory usage
- Logs
- Process information

## Maintenance

### Regular Tasks

1. **Update dependencies** (monthly):
   ```bash
   cd /var/www/ogc-platform/backend
   npm audit
   npm update
   npm install
   pm2 restart ogc-backend
   ```

2. **Check logs** (weekly):
   ```bash
   pm2 logs ogc-backend --lines 200
   ```

3. **Monitor performance**:
   ```bash
   pm2 monit
   ```

4. **Backup database** (daily):
   ```bash
   # Add your database backup script here
   ```

### Security

1. **Keep dependencies updated**:
   ```bash
   npm audit
   npm audit fix
   ```

2. **Review environment variables**:
   Ensure `.env` file has proper permissions:
   ```bash
   chmod 600 /var/www/ogc-platform/backend/.env
   ```

3. **Monitor for suspicious activity**:
   ```bash
   pm2 logs ogc-backend --err | grep -i error
   ```

## Production Checklist

Before going live, ensure:

- [ ] Environment variables are configured
- [ ] Database migrations are applied
- [ ] Backend starts successfully with PM2
- [ ] Status and health endpoints respond correctly
- [ ] Nginx proxy configuration is correct
- [ ] CORS is configured for production domains
- [ ] PM2 startup script is configured
- [ ] Logs are being generated correctly
- [ ] Database backups are configured
- [ ] Monitoring is set up

## Support

For issues or questions:

1. Check PM2 logs: `pm2 logs ogc-backend`
2. Review this deployment guide
3. Check the main project documentation
4. Review Git commit history for recent changes

