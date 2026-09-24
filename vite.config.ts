import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /**
   * Absolute, because the app now serves nested URLs: an answers page lives
   * at /a/<code>. A relative base makes the browser resolve the bundle
   * against that path and ask for /a/assets/..., which the catch-all rewrite
   * answers with index.html, and the page dies trying to run HTML as script.
   *
   * This ties the build to being served from the domain root. Moving it under
   * a subpath again, /class-of-27/ say, means setting that path here.
   */
  base: '/',
  plugins: [react()],
  server: { port: 5173 },
});
