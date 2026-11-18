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
  test('evaluates landing page accessibility at desktop (1440px, 1366px) and mobile (375px)', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    const desktopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(desktopResults.violations);

    // 2. Desktop 1366x768 (standard laptop viewport)
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(200);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow, 'no horizontal scrollbar at 1366px').toBe(false);

    const laptopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(laptopResults.violations);

    // 3. Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(mobileResults.violations);
  });

  test('evaluates loaded visualizer state accessibility at desktop (1440px) and mobile (375px)', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    const desktopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(desktopResults.violations);

    // 2. Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(mobileResults.violations);
  });

  test('evaluates loaded visualizer state at 1366px laptop viewport (no horizontal overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/?view=app');
    await page.waitForSelector('header');
    await page.waitForTimeout(200);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow, 'no horizontal scrollbar at 1366px').toBe(false);

    const laptopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(laptopResults.violations);
  });

  test('evaluates empty state accessibility after resetting document at 1440px and 375px', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=app');
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

    const desktopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(desktopResults.violations);

    // 2. Mobile 375x812 (drawer open)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(mobileResults.violations);

    // 3. Mobile 375x812 (drawer closed, viewing empty canvas)
    const closeDrawerBtn = page.getByRole('button', { name: 'Close configuration drawer' });
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.click();
      await page.waitForTimeout(300);
      await expect(emptyRegion).toBeVisible();
      const mobileCanvasResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(mobileCanvasResults.violations);
    }
  });

  test('evaluates error state accessibility with corrupt PDF upload at 1440px and 375px', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    const corruptPdfPath = path.resolve(process.cwd(), 'src/test-fixtures/corrupt.pdf');
    const fileInput = page.locator('input[type="file"]').first();

    await fileInput.setInputFiles(corruptPdfPath);

    // Assert exactly one role="alert" rendered across the page (no duplicate announcements)
    const alert = page.getByRole('alert');
    await expect(alert).toHaveCount(1);
    await expect(alert).toBeVisible({ timeout: 10000 });

    const desktopResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(desktopResults.violations);

    // 2. Mobile 375x812 (drawer closed so alert banner on main canvas is prominent)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const closeDrawerBtn = page.getByRole('button', { name: 'Close configuration drawer' });
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(alert).toHaveCount(1);
    await expect(alert).toBeVisible();

    const mobileAlertResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(mobileAlertResults.violations);

    // 3. Mobile 375x812 (drawer opened)
    const openDrawerBtn = page.getByRole('button', { name: /expand sidebar/i });
    if (await openDrawerBtn.isVisible()) {
      await openDrawerBtn.click();
      await page.waitForTimeout(300);
      const mobileDrawerResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(mobileDrawerResults.violations);
    }
  });

  test('opens empty document workbench setup tab first when launching visualizer from landing page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    // Click "Launch Visualizer" from the hero
    const launchBtn = page.getByRole('button', { name: 'Launch Visualizer' }).first();
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Verify URL updated to ?view=app
    await expect(page).toHaveURL(/\?view=app/);

    // Verify empty state workbench is displayed first
    const emptyRegion = page.getByRole('region', { name: 'Document setup and sample selection' });
    await expect(emptyRegion).toBeVisible();
    await expect(page.getByText('Document Chunking & RAG Cost Workbench')).toBeVisible();
    await expect(page.getByText('Drop your document here, or click to browse')).toBeVisible();

    // Verify header displays "No document"
    await expect(page.getByText('No document')).toBeVisible();
  });

  test('evaluates landing page tab navigation and accessibility across all tabs at 1440px and 375px', async ({ page }) => {
    // 1. Desktop 1440x900 - test each tab navigation & WCAG compliance
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForSelector('header');

    const mainNav = page.getByRole('navigation', { name: 'Main landing navigation' });
    const tabLabels = ['Features & Engine', 'Use Cases', 'Zero-Egress Security', 'Docs & API', 'Overview'];

    for (const label of tabLabels) {
      const tabButton = mainNav.getByRole('button', { name: label, exact: true });
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(200);
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        assertNoAxeViolations(results.violations);
      }
    }

    // 2. Mobile 375x812 - test mobile menu drawer accessibility
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(200);

    const openMenuBtn = page.getByRole('button', { name: 'Open menu' });
    if (await openMenuBtn.isVisible()) {
      await openMenuBtn.click();
      await page.waitForTimeout(200);
      const menuResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(menuResults.violations);

      const closeMenuBtn = page.getByRole('button', { name: 'Close menu' });
      await closeMenuBtn.click();
      await page.waitForTimeout(200);
    }
  });
});
