import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.use({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: 'dark',
});

test('captures current workbench hero screenshot in dark mode for README', async ({ page }) => {
  // Navigate to workbench view with dark colorScheme
  await page.goto('/?view=app');
  await page.waitForSelector('header');

  // Also ensure localStorage is set to dark
  await page.evaluate(() => {
    localStorage.setItem('chunklens_theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  });
  await page.waitForTimeout(500);

  // Select Developer API Reference & Code sample
  const sampleBtn = page.getByRole('button', { name: /Developer API Reference & Code/i }).first();
  if (await sampleBtn.isVisible()) {
    await sampleBtn.click();
    await page.waitForTimeout(1000);
  }

  // Ensure chunks are visible
  await page.waitForSelector('[data-testid^="chunk-card-"], .space-y-4, main article, main', { state: 'visible' });
  await page.waitForTimeout(1000);

  // Define target paths
  const targetDark = path.resolve('docs/design/v1.0/workbench_1440_dark.png');
  const targetV1 = path.resolve('docs/design/v1.0/workbench_1440.png');
  const targetLegacy = path.resolve('docs/design/after-v0.3/loaded_1440.png');
  const artifactTarget = '/home/drago/.gemini/antigravity/brain/d82582c0-32d4-44c7-a92d-d5a92eacd7ec/workbench_1440_dark.png';

  // Take screenshot
  await page.screenshot({ path: targetDark, fullPage: false });
  fs.copyFileSync(targetDark, targetV1);
  fs.copyFileSync(targetDark, targetLegacy);
  fs.copyFileSync(targetDark, artifactTarget);

  console.log('Saved dark mode workbench screenshot successfully!');
});
