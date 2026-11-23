import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

// Config portability: Optional environment variable PW_CHROME_PATH.
// When omitted, check standard local cache fallback or default browser binaries.
const localChromePath = '/home/drago/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const executablePath =
  process.env.PW_CHROME_PATH ||
  (fs.existsSync(localChromePath) ? localChromePath : undefined);

// Proxy detection: Apply loopback bypass only when a proxy is configured in the environment
const hasProxy = Boolean(
  process.env.http_proxy ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.HTTPS_PROXY
);

const launchEnv = hasProxy
  ? {
      ...process.env,
      NO_PROXY: '127.0.0.1,localhost,::1',
      no_proxy: '127.0.0.1,localhost,::1',
    }
  : undefined;

const firefoxPrefs = hasProxy
  ? {
      'network.proxy.type': 1,
      'network.proxy.no_proxies_on': '127.0.0.1, localhost, ::1',
    }
  : undefined;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'compat.spec.ts',
  timeout: 30000,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-compat' }],
  ],
  webServer: {
    command: 'npm run build && ./node_modules/.bin/vite preview --host 127.0.0.1 --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // --- Chromium Matrix ---
    {
      name: 'chromium-mobile-390',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-mobile-600',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 600, height: 960 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-landscape-390x340',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 390, height: 340 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-zoom400-320',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: 'chromium-tablet-portrait-768',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'chromium-tablet-landscape-1024',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'chromium-laptop-1280',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'chromium-desktop-1366',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'chromium-desktop-1920',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'chromium-desktop-2560',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 2560, height: 1440 },
      },
    },
    {
      name: 'chromium-ultrawide-3440',
      use: {
        browserName: 'chromium',
        launchOptions: { ...(executablePath ? { executablePath } : {}), env: launchEnv },
        viewport: { width: 3440, height: 1440 },
      },
    },

    // --- Firefox Matrix (Narrow viewport only, no mobile/touch emulation) ---
    {
      name: 'firefox-narrow-390',
      use: {
        browserName: 'firefox',
        launchOptions: { env: launchEnv, firefoxUserPrefs: firefoxPrefs },
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'firefox-tablet-portrait-768',
      use: {
        browserName: 'firefox',
        launchOptions: { env: launchEnv, firefoxUserPrefs: firefoxPrefs },
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'firefox-tablet-landscape-1024',
      use: {
        browserName: 'firefox',
        launchOptions: { env: launchEnv, firefoxUserPrefs: firefoxPrefs },
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'firefox-laptop-1280',
      use: {
        browserName: 'firefox',
        launchOptions: { env: launchEnv, firefoxUserPrefs: firefoxPrefs },
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'firefox-desktop-1366',
      use: {
        browserName: 'firefox',
        launchOptions: { env: launchEnv, firefoxUserPrefs: firefoxPrefs },
        viewport: { width: 1366, height: 768 },
      },
    },

    // --- WebKit Matrix ---
    {
      name: 'webkit-mobile-390',
      use: {
        browserName: 'webkit',
        launchOptions: { env: launchEnv },
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
    {
      name: 'webkit-tablet-portrait-768',
      use: {
        browserName: 'webkit',
        launchOptions: { env: launchEnv },
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
    {
      name: 'webkit-tablet-landscape-1024',
      use: {
        browserName: 'webkit',
        launchOptions: { env: launchEnv },
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'webkit-laptop-1280',
      use: {
        browserName: 'webkit',
        launchOptions: { env: launchEnv },
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'webkit-desktop-1366',
      use: {
        browserName: 'webkit',
        launchOptions: { env: launchEnv },
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
});
