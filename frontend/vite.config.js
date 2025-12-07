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
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

