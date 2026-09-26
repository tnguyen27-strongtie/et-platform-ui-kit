import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev server for the component showcase (src/showcase). Not needed when the kit is
// copied into an Nx workspace: there it is consumed as libs/ui source.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
