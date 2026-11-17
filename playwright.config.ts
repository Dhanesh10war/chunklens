import { defineConfig, devices } from '@playwright/test';
import os from 'os';
import path from 'path';
import fs from 'fs';

const fallbackChrome = path.join(
  os.homedir(),
  '.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome'
);
const executablePath =
  process.env.PW_CHROME_PATH ||
  (fs.existsSync(fallbackChrome) ? fallbackChrome : undefined);

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
