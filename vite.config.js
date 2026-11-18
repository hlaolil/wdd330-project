import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/',
  base: './', // relative paths so the build works on Netlify or in a sub-folder
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: resolve(__dirname, 'src/index.html') },
    },
  },
});
