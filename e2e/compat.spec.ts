import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

// ============================================================================
// Granular Known-Offender Allowlists (Mirrored from docs/compat-baseline.md)
// A test fails if:
// (a) an unexpected offender not on the list appears, or
// (b) an offender on the list is fixed but still listed (forcing removal).
// ============================================================================

const KNOWN_HORIZONTAL_OVERFLOW_VIEWPORTS: number[] = [
  // All baseline overflow viewports (320, 340, 768, 1024, 1280, 1366) fixed in Batch 1
];

const KNOWN_COARSE_TOUCH_OFFENDERS = [
  'button:new document',
  'input:remember my document',
  'button:chunking strategy',
  'button:unit & tokenizer',
  'button:size & overlap',
  'input:target chunk size',
  'input:overlap window',
];

const KNOWN_DARK_THEME_CONTRAST_TARGETS = [
  '.lg\\:flex-row > div:nth-child(1) > .mb-1.text-accent.inline-flex > span',
  '.min-w-\\[55px\\]',
  '.max-w-xl.mb-10.text-center > .mb-1.text-accent.inline-flex > span',
  'div:nth-child(1) > .mb-2.justify-between.flex > .tabular-nums.font-bold.text-accent',
  'div:nth-child(2) > .mb-2.justify-between.flex > .tabular-nums.font-bold.text-accent',
  '.mb-1.block.text-accent',
  '.text-accent.font-semibold.text-xs',
  '.md\\:flex-row > div:nth-child(1) > .mb-1.text-accent.inline-flex > span',
  '.mb-2.text-accent.inline-flex > span',
  '.hover\\:underline',
];

test.describe('Platform & Viewport Compatibility Suite', () => {

  // -------------------------------------------------------------------------
  // 1. Landing Page: All Tabs No Horizontal Overflow & Element Containment
  // -------------------------------------------------------------------------
  test('Landing page tabs have no horizontal page overflow and stay contained', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header');

    const tabNames = ['Features & Engine', 'Use Cases', 'Zero-Egress Security', 'Docs & API', 'Overview'];
    for (const name of tabNames) {
      const tabBtn = page.getByRole('button', { name, exact: true }).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(200);
      }

      // Assert no horizontal page scrollbar
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow, `no horizontal page overflow on tab ${name}`).toBe(false);

      // Assert no elements bleed outside viewport
      const outsideElements = await page.evaluate(() => {
        const vw = window.innerWidth;
        const bad: string[] = [];
        const all = document.querySelectorAll('header, main, section, footer, nav, [role="region"]');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > vw + 1 || rect.left < -1) {
            bad.push(`${el.tagName.toLowerCase()}.${el.className.slice(0, 40)} [${Math.round(rect.left)}..${Math.round(rect.right)} vs ${vw}]`);
          }
        }
        return bad;
      });
      expect(outsideElements, `elements contained on tab ${name}`).toEqual([]);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Workbench: Loaded State Horizontal Overflow & Granular Allowlist
  // -------------------------------------------------------------------------
  test('Workbench visualizer loaded state has no horizontal page overflow', async ({ page, browserName }) => {
    await page.goto('/?view=app');
    await page.waitForSelector('header');
    await page.waitForTimeout(200);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const viewportWidth = page.viewportSize()?.width ?? clientWidth;
    const hasHorizontalOverflow = scrollWidth > clientWidth;
    // WebKit at 768px subtracts scrollbar to 762px, falling below the md: breakpoint and rendering mobile layout
    const isAllowlisted =
      KNOWN_HORIZONTAL_OVERFLOW_VIEWPORTS.includes(viewportWidth) &&
      !(browserName === 'webkit' && viewportWidth === 768);

    if (hasHorizontalOverflow) {
      if (!isAllowlisted) {
        throw new Error(`Unexpected horizontal overflow in ${browserName} at viewport ${viewportWidth}px (scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px)! Not in allowlist.`);
      }
      test.fail(true, `Baseline failure: horizontal overflow at ${viewportWidth}px (${scrollWidth}px vs ${clientWidth}px); scheduled for Batch 1`);
    } else {
      if (isAllowlisted) {
        throw new Error(`Offender at viewport ${viewportWidth}px was fixed (no overflow), but is still listed in KNOWN_HORIZONTAL_OVERFLOW_VIEWPORTS! Remove it from the allowlist.`);
      }
    }
    expect(hasHorizontalOverflow, 'no horizontal scrollbar on workbench').toBe(false);
  });

  // -------------------------------------------------------------------------
  // 3. Workbench: View States Layout Integrity & Granular Allowlist
  // -------------------------------------------------------------------------
  test('Workbench states (empty, heatmap, modal, command palette) maintain layout integrity', async ({ page, browserName }) => {
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    // 3a. Heatmap tab
    const heatmapTab = page.locator('button[role="tab"]:has-text("Heatmap")').first();
    if (await heatmapTab.isVisible()) {
      await heatmapTab.click();
      await page.waitForSelector('[role="region"][aria-label="Similarity matrix grid"]');
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      const viewportWidth = page.viewportSize()?.width ?? clientWidth;
      const hasOverflow = scrollWidth > clientWidth;
      const isAllowlisted =
        KNOWN_HORIZONTAL_OVERFLOW_VIEWPORTS.includes(viewportWidth) &&
        !(browserName === 'webkit' && viewportWidth === 768);

      if (hasOverflow) {
        if (!isAllowlisted) {
          throw new Error(`Unexpected heatmap overflow at ${viewportWidth}px (${scrollWidth}px vs ${clientWidth}px); not in allowlist`);
        }
        test.fail(true, `Baseline failure: heatmap view causes horizontal overflow at ${viewportWidth}px; scheduled for Batch 1`);
      } else if (isAllowlisted) {
        // If fixed, force removal
        throw new Error(`Heatmap overflow at viewport ${viewportWidth}px was fixed, but is still listed in allowlist! Remove it.`);
      }
      expect(hasOverflow, 'heatmap tab has no page overflow').toBe(false);
    }

    // 3b. Modals: Tokenizer comparison modal
    const compareBtn = page.getByRole('button', { name: /Compare Tokenizers/i }).first();
    if (await compareBtn.isVisible()) {
      await compareBtn.click();
      await page.waitForSelector('[role="dialog"]');
      const dialogRect = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return null;
        const r = dialog.getBoundingClientRect();
        return { left: r.left, right: r.right, vw: window.innerWidth };
      });
      if (dialogRect) {
        expect(dialogRect.left).toBeGreaterThanOrEqual(0);
        expect(dialogRect.right).toBeLessThanOrEqual(dialogRect.vw + 1);
      }
      await page.keyboard.press('Escape');
    }

    // 3c. Command Palette (Cmd+K)
    await page.keyboard.press('ControlOrMeta+k');
    const palette = page.locator('[role="dialog"] input');
    if (await palette.isVisible()) {
      const paletteContained = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return true;
        const r = dialog.getBoundingClientRect();
        return r.left >= 0 && r.right <= window.innerWidth;
      });
      expect(paletteContained, 'command palette is within viewport').toBe(true);
      await page.keyboard.press('Escape');
    }
  });

  // -------------------------------------------------------------------------
  // 4. Touch Targets Under Coarse Pointer & Granular Allowlist
  // -------------------------------------------------------------------------
  test('Touch targets under coarse pointer meet minimum 24px and goal 44px requirements', async ({ page }) => {
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    // On narrow viewports where sidebar is in a drawer, open the drawer to evaluate drawer controls
    const isSidebarClosed = await page.evaluate(() => !document.querySelector('aside'));
    if (isSidebarClosed) {
      const sidebarToggle = page.getByRole('button', { name: /sidebar/i }).first();
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await page.waitForSelector('aside');
      }
    }

    const subMinTargets = await page.evaluate(() => {
      const bad: Array<{ tag: string; label: string; width: number; height: number }> = [];
      const interactives = document.querySelectorAll('button:not([disabled]), a[href], input, select');
      for (const el of interactives) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // Sub-24px check
        if (rect.width < 24 || rect.height < 24) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            label: (
              el.getAttribute('aria-label') ||
              el.textContent ||
              el.closest('label')?.textContent ||
              (el as HTMLInputElement).placeholder ||
              (el as HTMLInputElement).name ||
              ''
            ).trim().toLowerCase().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
      return bad;
    });

    if (subMinTargets.length > 0) {
      // Validate every detected sub-24px target matches the known allowlist
      for (const target of subMinTargets) {
        const key = `${target.tag}:${target.label}`;
        const matched = KNOWN_COARSE_TOUCH_OFFENDERS.some((item) => key.includes(item) || item.includes(key));
        if (!matched) {
          throw new Error(`Unexpected touch target under 24px: ${key} (${target.width}x${target.height}px)! Not in allowlist.`);
        }
      }
      test.fail(true, `Baseline failure: ${subMinTargets.length} controls under 24px/44px on coarse pointers (all allowlisted); scheduled for Batch 3`);
    } else {
      // If none found, verify allowlist is cleaned up
      if (KNOWN_COARSE_TOUCH_OFFENDERS.length > 0) {
        throw new Error('All touch targets now meet >= 24px, but KNOWN_COARSE_TOUCH_OFFENDERS is still populated! Remove them.');
      }
    }

    expect(subMinTargets, 'no interactive elements under 24px').toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 5. Tooltips: Assertion of Visibility & Strict Clamping Bounds
  // -------------------------------------------------------------------------
  test('Tooltips and popovers remain fully visible inside viewport bounds', async ({ page }) => {
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    // 5a. Test First Toolbar Button: Sidebar Toggle Button (far left)
    const toggleBtn = page.getByRole('button', { name: /sidebar/i }).first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.focus();
    await page.waitForTimeout(350);

    const sidebarTooltip = page.locator('[role="tooltip"]');
    // Must assert visible tooltip exists!
    await expect(sidebarTooltip).toBeVisible({ timeout: 5000 });

    const toggleRect = await sidebarTooltip.boundingBox();
    expect(toggleRect, 'sidebar toggle tooltip bounding box').not.toBeNull();
    if (toggleRect) {
      expect(toggleRect.x, 'sidebar toggle tooltip left bound >= 0').toBeGreaterThanOrEqual(0);
      const vw = await page.evaluate(() => window.innerWidth);
      expect(toggleRect.x + toggleRect.width, 'sidebar toggle tooltip right bound <= vw').toBeLessThanOrEqual(vw + 1);
    }

    // 5b. Test Last Toolbar Button: More Actions Menu Button (far right)
    const lastBtn = page.locator('header button').last();
    await expect(lastBtn).toBeVisible();
    await lastBtn.focus();
    await page.waitForTimeout(350);

    const lastTooltip = page.locator('[role="tooltip"]');
    await expect(lastTooltip).toBeVisible({ timeout: 5000 });

    const lastRect = await lastTooltip.boundingBox();
    expect(lastRect, 'more actions tooltip bounding box').not.toBeNull();
    if (lastRect) {
      expect(lastRect.x, 'more actions tooltip left bound >= 0').toBeGreaterThanOrEqual(0);
      const vw = await page.evaluate(() => window.innerWidth);
      expect(lastRect.x + lastRect.width, 'more actions tooltip right bound <= vw').toBeLessThanOrEqual(vw + 1);
    }
  });

  // -------------------------------------------------------------------------
  // 6a. Axe Accessibility: Light Theme
  // -------------------------------------------------------------------------
  test('Landing page light theme accessibility meets WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(300);

    const lightResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    assertNoAxeViolations(lightResults.violations);
  });

  // -------------------------------------------------------------------------
  // 6b. Axe Accessibility: Dark Theme & Granular Contrast Allowlist
  // -------------------------------------------------------------------------
  test('Landing page dark theme accessibility meets WCAG 2.2 AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('header');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
    await page.waitForTimeout(500);

    const darkResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    if (darkResults.violations.length > 0) {
      // Validate every violation is on the contrast allowlist
      for (const v of darkResults.violations) {
        if (v.id !== 'color-contrast') {
          throw new Error(`Unexpected non-contrast violation in dark theme: ${v.id} - ${v.help}!`);
        }
        for (const node of v.nodes) {
          const targetStr = node.target.join(' ');
          const isAllowlisted = KNOWN_DARK_THEME_CONTRAST_TARGETS.some((item) => targetStr.includes(item));
          if (!isAllowlisted) {
            throw new Error(`Unexpected dark theme contrast violation on target: ${targetStr}! Not in allowlist.`);
          }
        }
      }
      test.fail(true, `Baseline failure: ${darkResults.violations[0].nodes.length} dark theme accent text contrast violations (all allowlisted); scheduled for Batch 2`);
    } else {
      if (KNOWN_DARK_THEME_CONTRAST_TARGETS.length > 0) {
        throw new Error('Dark theme contrast now passes, but KNOWN_DARK_THEME_CONTRAST_TARGETS is still populated! Remove them.');
      }
    }

    assertNoAxeViolations(darkResults.violations);
  });
});
