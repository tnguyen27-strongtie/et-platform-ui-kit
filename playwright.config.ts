import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 5199);

const ci = !!process.env.CI;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    { name: 'safari-mobile', use: { ...devices['iPhone 15'] }, grep: /@mobile/ },
  ],
  webServer: {
    // Start vite directly, not through a package-manager script: a launcher in between may not
    // pass the shutdown on to vite, so vite outlives the run and Playwright waits for it forever.
    command: `node_modules/.bin/vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !ci,
  },
});
