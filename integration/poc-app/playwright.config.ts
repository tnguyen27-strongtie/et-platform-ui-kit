import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 5299);

// Runs against the production build (vite preview), because apps ship built code: CSS layer
// order and font loading differ between the dev server and a build.
export default defineConfig({
  testDir: 'e2e',
  reporter: 'list',
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    // Tests tagged @mobile run only in the mobile project.
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    { name: 'safari', use: { ...devices['Desktop Safari'] }, grepInvert: /@mobile/ },
  ],
  webServer: {
    command: `node_modules/.bin/vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
  },
});
