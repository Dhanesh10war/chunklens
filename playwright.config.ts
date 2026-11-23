import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

// Config portability: Optional environment variable PW_CHROME_PATH.
// When omitted, check standard local cache fallback or default browser binaries.
const localChromePath = '/home/drago/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const executablePath =
  process.env.PW_CHROME_PATH ||
  (fs.existsSync(localChromePath) ? localChromePath : undefined);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
});
