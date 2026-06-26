import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        brand: 'brand.html'
      }
    }
  }
});
