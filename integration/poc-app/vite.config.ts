import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The setup from docs/getting-started.md, unchanged: if the PoC needs more than this, so do apps.
export default defineConfig({ plugins: [react(), tailwindcss()] });
