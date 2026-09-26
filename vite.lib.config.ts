import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import pkg from './package.json' with { type: 'json' };

// Library build: ESM with one file per source module (tree-shakable), every
// dependency external so apps share a single React/MUI/Emotion instance.
const externals = [...Object.keys(pkg.peerDependencies), ...Object.keys(pkg.dependencies)];
const isExternal = (id: string) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: { entry: 'src/index.ts', formats: ['es'] },
    rolldownOptions: {
      external: isExternal,
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
  },
});
