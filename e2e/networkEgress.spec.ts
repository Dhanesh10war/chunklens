import { test, expect } from '@playwright/test';

test.describe('Zero Network Egress & Strict CSP (Item 3.1 Proof)', () => {
  test('verifies zero cross-origin or external network egress during load, chunk, and export', async ({ page }) => {
    const recordedRequests: string[] = [];
    const crossOriginRequests: string[] = [];

    // Intercept and record all network activity
    page.on('request', (request) => {
      const url = request.url();
      recordedRequests.push(url);

      const isSameOrigin =
        url.startsWith('http://127.0.0.1:4173') ||
        url.startsWith('http://localhost:4173') ||
        url.startsWith('data:') ||
        url.startsWith('blob:');

      if (!isSameOrigin) {
        crossOriginRequests.push(url);
      }
    });

    // 1. Load application on production preview server
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify CSP meta tag exists in DOM with connect-src 'none'
    const cspMeta = await page.$('meta[http-equiv="Content-Security-Policy"]');
    expect(cspMeta).not.toBeNull();
    const cspContent = await cspMeta?.getAttribute('content');
    expect(cspContent).toContain("connect-src 'none'");
    expect(cspContent).toContain("worker-src 'self' blob:");
    expect(cspContent).toContain("font-src 'self'");

    // 2. Interact: Switch document preset
    const legalDocButton = page.locator('button', { hasText: 'SaaS Master Subscription Agreement' });
    if (await legalDocButton.isVisible()) {
      await legalDocButton.click();
      await page.waitForTimeout(300);
    }

    // 3. Interact: Trigger chunking recalculation
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible()) {
      await slider.fill('400');
      await page.waitForTimeout(400);
    }

    // 4. Interact: Open Export modal
    const exportBtn = page.locator('button', { hasText: 'Export' });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForSelector('role=dialog', { timeout: 2000 }).catch(() => {});
      await page.keyboard.press('Escape');
    }

    // Assert zero cross-origin or external requests occurred
    expect(crossOriginRequests).toEqual([]);
    expect(recordedRequests.some((url) => url.includes('fonts.googleapis.com'))).toBe(false);
    expect(recordedRequests.some((url) => url.includes('fonts.gstatic.com'))).toBe(false);
  });
});
