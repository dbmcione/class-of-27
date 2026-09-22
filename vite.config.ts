import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative so the same bundle works at a domain root and under a
  // /<repo>/ subpath, which is how GitHub Pages serves a project site.
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
