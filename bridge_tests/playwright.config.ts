import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm --prefix ../bridge_app run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    // USE_REAL_SUPABASE=1: real creds for auth tests that hit Supabase directly.
    // Otherwise: dummy creds so the client initialises and requests are intercepted by page.route().
    env: process.env.USE_REAL_SUPABASE
      ? {
          VITE_SUPABASE_URL: process.env.SUPABASE_URL ?? '',
          VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
        }
      : {
          VITE_SUPABASE_URL: 'https://test-project.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        },
  },
});
