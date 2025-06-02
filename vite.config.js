import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  root: '.', // Project root
  base: '/', // Base path for deployment (adjust if hosting in a subdirectory)
  build: {
    outDir: 'dist', // Output directory for production build
    target: 'esnext', // Target modern browsers supporting ES modules
    minify: 'esbuild', // Minify using esbuild for faster builds
    sourcemap: true, // Generate sourcemaps for debugging
  },
  server: {
    open: true, // Open browser on dev server start
    port: 3000, // Dev server port
    proxy: {
      // Proxy API requests to avoid CORS issues during development
      '/api/openlibrary': {
        target: 'https://openlibrary.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openlibrary/, ''),
        secure: false,
      },
      '/api/doaj': {
        target: 'https://doaj.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/doaj/, ''),
        secure: false,
      },
    },
  },
  esbuild: {
    // Ensure .mjs files are treated as JavaScript
    loader: { '.mjs': 'js' },
  },
});