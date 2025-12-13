import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure assets work correctly behind Nginx
  server: {
    host: 'localhost', // Local development - use localhost
    port: 5173,
    strictPort: false,
    open: false,
    // Dev server proxy - proxies /api/* to backend on localhost:4000
    // This allows frontend to call /api/v1/auth/* and it will be forwarded to http://localhost:4000/api/v1/auth/*
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        // Preserve the full path including /api/v1
        rewrite: (path) => path, // Don't rewrite, keep /api/v1 as-is
        // Ensure cookies are forwarded
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: '/',
      }
    }
  }
});

