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

  // -------------------------------------------------------------------------
  // 7. Learn Track: Curriculum Map Accessibility (1440px & 375px, Light & Dark)
  // -------------------------------------------------------------------------
  test('evaluates Learn curriculum map accessibility at 1440px and 375px in light and dark themes', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((th) => {
        localStorage.setItem('chunklens_theme', th);
      }, theme);

      // 1. Desktop 1440x900
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/?view=learn');
      await page.waitForSelector('header');
      await page.waitForTimeout(300);

      const desktopAxe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(desktopAxe.violations);

      // Verify no horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow, `no horizontal overflow at 1440px in ${theme}`).toBe(false);

      // 2. Mobile 375x812
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);

      const mobileAxe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(mobileAxe.violations);

      const mobileOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(mobileOverflow, `no horizontal overflow at 375px in ${theme}`).toBe(false);
    }
  });

  // -------------------------------------------------------------------------
  // 8. Learn Track: Lesson 1.1 + V1 Explorer Accessibility (1440px & 375px)
  // -------------------------------------------------------------------------
  test('evaluates Lesson 1.1 and V1 Pipeline widget accessibility at 1440px and 375px in light and dark themes', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((th) => {
        localStorage.setItem('chunklens_theme', th);
      }, theme);

      // Desktop 1440x900
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/?view=learn&lesson=1-1-what-is-rag');
      await page.waitForSelector('header');
      await page.waitForTimeout(400);

      // Verify V1 Widget honesty badge and diagram are present
      await expect(page.getByText('RAG Pipeline Flow Simulator')).toBeVisible();
      await expect(page.getByText('Illustration')).toBeVisible();

      // Test accessible data table toggle
      const tableToggleBtn = page.getByRole('button', { name: /Accessible Table/i });
      if (await tableToggleBtn.isVisible()) {
        await tableToggleBtn.click();
        await page.waitForTimeout(200);
        await expect(page.getByRole('table')).toBeVisible();
      }

      const desktopAxe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(desktopAxe.violations);

      // Mobile 375x812
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);

      const mobileAxe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(mobileAxe.violations);
    }
  });

  // -------------------------------------------------------------------------
  // 9. Learn Track: Lesson 3.2 + V2 Sandbox Accessibility (1440px & 375px)
  // -------------------------------------------------------------------------
  test('evaluates Lesson 3.2 and V2 Chunk Sandbox accessibility at 1440px and 375px in light and dark themes', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await page.addInitScript((th) => {
        localStorage.setItem('chunklens_theme', th);
      }, theme);

      // Desktop 1440x900
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/?view=learn&lesson=3-2-the-size-trade-off');
      await page.waitForSelector('header');
      await page.waitForTimeout(400);

      // Verify V2 Sandbox honesty badge
      await expect(page.getByText('Live Document Chunking Sandbox')).toBeVisible();
      await expect(page.getByText('Real engine')).toBeVisible();

      // Test accessible table toggle
      const tableToggleBtn = page.getByRole('button', { name: /Accessible Table/i });
      if (await tableToggleBtn.isVisible()) {
        await tableToggleBtn.click();
        await page.waitForTimeout(200);
        await expect(page.getByRole('table').first()).toBeVisible();
      }

      const desktopAxe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(desktopAxe.violations);

      // Mobile 375x812
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);

      const mobileAxe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      assertNoAxeViolations(mobileAxe.violations);
    }
  });

  // -------------------------------------------------------------------------
  // 10. Learn Track: 200% Zoom and Interactive Target Sizing (>= 24px)
  // -------------------------------------------------------------------------
  test('evaluates Learn Track under 200% zoom and touch target sizes (>= 24px)', async ({ page }) => {
    // 200% zoom on a standard 1366px screen yields an effective viewport of 683px
    await page.setViewportSize({ width: 683, height: 768 });
    await page.goto('/?view=learn&lesson=3-2-the-size-trade-off');
    await page.waitForSelector('header');
    await page.waitForTimeout(400);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow, 'no horizontal scrollbar at 200% zoom equivalent (683px)').toBe(false);

    // Verify touch targets >= 24px
    const subMinTargets = await page.evaluate(() => {
      const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"]'));
      const bad: { tag: string; label: string; width: number; height: number }[] = [];
      for (const el of interactives) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.width < 24 || rect.height < 24) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
      return bad;
    });

    expect(subMinTargets, 'all Learn controls meet minimum 24px touch target requirement').toEqual([]);
  });
});
