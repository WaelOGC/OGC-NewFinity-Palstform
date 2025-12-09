# Local Development Setup Guide

This guide explains how to run the OGC NewFinity Platform locally on Windows using Node.js and npm.

## Requirements

- **Node.js**: Version 18.x or higher (recommended: 20.x LTS)
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For cloning the repository (if needed)

## Installation

### 1. Install Dependencies

From the project root, run:

```powershell
npm run install:all
```

This will install dependencies for:
- Root project
- Frontend (`frontend/`)
- Backend (`backend/`)

Alternatively, install manually:

```powershell
npm install
cd frontend
npm install
cd ../backend
npm install
cd ..
```

## Running Locally

### Option 1: Run Both Frontend and Backend Together (Recommended)

From the project root:

```powershell
npm run dev
```

This starts both:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:4000 (Express server) <!-- Backend + DB: OFFLINE -->

### Option 2: Run Frontend and Backend Separately

**Terminal 1 - Frontend:**
```powershell
cd frontend
npm run dev
```
Frontend will be available at: http://localhost:5173

**Terminal 2 - Backend:** <!-- Backend + DB: OFFLINE -->
```powershell
cd backend
npm run dev
```
Backend will be available at: http://localhost:4000

## Environment Variables

### Frontend

The frontend uses Vite environment variables. For local development, the default configuration works out of the box:

- **API Base URL**: Defaults to `/api` (uses Vite proxy to backend)
- **Vite Dev Server**: http://localhost:5173

If you need to customize, create `frontend/.env.development`:

```env
VITE_API_BASE_URL="/api"
```

### Backend

The backend uses `dotenv` to load environment variables. For local development, create `backend/.env`:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
HOST=localhost

# CORS - Allow localhost origins
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# JWT Secrets (use strong random values in production)
JWT_ACCESS_SECRET=dev-access-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# Database (if using Prisma)
# DATABASE_URL="postgresql://user:password@localhost:5432/ogc_newfinity?schema=public"
```

**Note**: The backend will work without a `.env` file using defaults, but you may need to configure database and JWT secrets for full functionality.

## Build for Production

To build the application for production:

```powershell
npm run build
```

This builds both frontend and backend:
- **Frontend**: Outputs to `frontend/dist/`
- **Backend**: No build step (runs directly with Node.js)

## Project Structure

```
.
├── frontend/          # React + Vite frontend
│   ├── src/          # Source code
│   ├── dist/         # Production build output
│   └── package.json   # Frontend dependencies
├── backend/           # Express.js backend
│   ├── src/          # Source code
│   └── package.json   # Backend dependencies
├── infra/             # Infrastructure files
│   └── vps/          # VPS/production deployment files (not needed for local dev)
└── package.json       # Root package.json with dev scripts
```

## VPS/Production Files

All VPS-specific files (PM2, Nginx, deployment scripts) have been moved to `infra/vps/` and are **not needed for local development**:

- `infra/vps/nginx/` - Nginx configuration (production only)
- `infra/vps/scripts/` - Deployment scripts (production only)

These files are clearly marked as production-only and will not interfere with local development.

## Troubleshooting

### Port Already in Use

If port 5173 (frontend) or 4000 (backend) is already in use:

**Frontend**: Edit `frontend/vite.config.js` and change the `port` value.

**Backend**: Set `PORT` environment variable:
```powershell
$env:PORT=4001
cd backend
npm run dev
```

### Backend Not Responding

1. Check that the backend is running: `http://localhost:4000/api/status`
2. Check backend logs in the terminal
3. Verify `.env` file exists in `backend/` directory (if needed)

### Frontend Can't Connect to Backend

1. Ensure backend is running on `http://localhost:4000`
2. Check that Vite proxy is configured in `frontend/vite.config.js`
3. Verify `VITE_API_BASE_URL` is set to `/api` (default)

### Module Not Found Errors

Run `npm install` in the affected directory:
```powershell
cd frontend
npm install
# or
cd backend
npm install
```

## Development Workflow

1. **Start development servers**: `npm run dev` (from root)
2. **Make changes** to code in `frontend/src/` or `backend/src/`
3. **Hot reload** - Both Vite and nodemon will automatically reload on file changes
4. **Test locally** at http://localhost:5173

## Next Steps

- See `backend/README.md` for backend-specific setup (database, Prisma, etc.)
- See `frontend/README.md` (if exists) for frontend-specific information
- For production deployment, see `infra/vps/` directory
