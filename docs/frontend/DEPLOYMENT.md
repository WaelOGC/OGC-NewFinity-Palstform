# Frontend Deployment

## Environment Variables

**Required for production:**

Set `VITE_API_BASE_URL="https://finityplatform.cloud/api"` to use the production backend API.

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
echo 'VITE_API_BASE_URL="https://finityplatform.cloud/api"' > .env
```

## Build & Deploy Steps

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Set environment variable** (if not already set in `.env`):
   ```bash
   export VITE_API_BASE_URL="https://finityplatform.cloud/api"
   # Or create .env file as shown above
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Deploy the build output:**
   - The build output is in `frontend/dist/`
   - Serve these static files using Nginx or your web server
   - Ensure the server is configured to proxy `/api/*` requests to the backend

**Note:** Environment variables must be set at build time. They are baked into the build output and cannot be changed at runtime without rebuilding.

