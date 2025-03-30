const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    outDir: '.vite/build',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron']
    }
  }
}); 