import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev server for the component showcase (src/showcase). Not needed when the kit is
// copied into an Nx workspace: there it is consumed as libs/ui source.
// SHOWCASE_BASE serves the built showcase from a sub-path, e.g. /et-platform-ui-kit/ on GitHub Pages.
export default defineConfig({
  base: process.env.SHOWCASE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
});
