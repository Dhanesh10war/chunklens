import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

test.describe('WCAG 2.2 AA Accessibility Audits', () => {
  test('evaluates loaded state accessibility at desktop (1440px) and mobile (375px)', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    const desktopResults = await new AxeBuilder({ page }).analyze();
    expect(desktopResults.violations).toEqual([]);

    // 2. Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileResults = await new AxeBuilder({ page }).analyze();
    expect(mobileResults.violations).toEqual([]);
  });

  test('evaluates empty state accessibility after resetting document', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    // Click "New document" button in sidebar to transition to real EmptyState
    const newDocButton = page.locator('button', { hasText: 'New document' });
    if (await newDocButton.isVisible()) {
      await newDocButton.click();
      await page.waitForSelector('[role="region"][aria-label="Document setup and sample selection"]');
    }

    const emptyResults = await new AxeBuilder({ page }).analyze();
    expect(emptyResults.violations).toEqual([]);
  });

  test('evaluates error state accessibility with corrupt PDF upload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    const corruptPdfPath = path.resolve(__dirname, '../src/test-fixtures/corrupt.pdf');
    const fileInput = page.locator('input[type="file"]').first();

    await fileInput.setInputFiles(corruptPdfPath);
    await page.waitForSelector('[role="alert"]', { timeout: 10000 });

    const errorResults = await new AxeBuilder({ page }).analyze();
    expect(errorResults.violations).toEqual([]);
  });
});
