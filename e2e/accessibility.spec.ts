import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function assertNoAxeViolations(violations: any[]) {
  expect(
    violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n: any) => ({
        target: n.target,
        html: n.html.slice(0, 120),
      })),
    })),
    'axe violations'
  ).toEqual([]);
}

test.describe('WCAG 2.2 AA Accessibility Audits', () => {
  test('evaluates loaded state accessibility at desktop (1440px) and mobile (375px)', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    const desktopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(desktopResults.violations);

    // 2. Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(mobileResults.violations);
  });

  test('evaluates empty state accessibility after resetting document', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    // Click "New document" button in sidebar to transition to real EmptyState
    const newDocButton = page.getByRole('button', { name: /New document/i });
    if (!(await newDocButton.isVisible())) {
      const toggleSidebarBtn = page.getByRole('button', { name: /expand sidebar/i });
      if (await toggleSidebarBtn.isVisible()) {
        await toggleSidebarBtn.click();
      }
    }
    await newDocButton.click();

    const emptyRegion = page.getByRole('region', { name: 'Document setup and sample selection' });
    await expect(emptyRegion).toBeVisible();

    const emptyResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(emptyResults.violations);
  });

  test('evaluates error state accessibility with corrupt PDF upload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    const corruptPdfPath = path.resolve(process.cwd(), 'src/test-fixtures/corrupt.pdf');
    const fileInput = page.locator('input[type="file"]').first();

    await fileInput.setInputFiles(corruptPdfPath);
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible({ timeout: 10000 });

    const errorResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(errorResults.violations);
  });
});
