import { defineConfig } from 'vite';

// Relative paths work on GitHub Pages project URLs and localhost.
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 8192 }
});
