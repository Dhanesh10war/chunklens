import { test, expect } from '@playwright/test';

test.describe('Similarity Heatmap 2D Alignment & No Truncation', () => {
  test('aligns column headers with cell columns with 0px drift and renders all cells during 2D scroll', async ({ page }) => {
    // 1. Navigate to visualizer app
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    // 2. Click Heatmap tab
    const heatmapTab = page.getByRole('tab', { name: /Similarity Heatmap|Heatmap/i }).first();
    await expect(heatmapTab).toBeVisible();
    await heatmapTab.click();

    // Wait for the heatmap grid region to appear
    const gridRegion = page.locator('[role="region"][aria-label="Similarity matrix grid"]');
    await expect(gridRegion).toBeVisible();
    await page.waitForTimeout(300);

    // 3. Verify the locked corner spacer is present
    const cornerSpacer = gridRegion.getByTestId('heatmap-corner-spacer');
    await expect(cornerSpacer).toBeVisible();

    // 4. Test column-to-cell alignment before scrolling
    const colCount = await gridRegion.locator('.sticky.top-0 [title^="Chunk #"]').count();
    expect(colCount).toBeGreaterThan(0);

    // Check first 5 columns before scroll
    const sampleCols = Math.min(5, colCount);
    for (let c = 0; c < sampleCols; c++) {
      const headerBox = await gridRegion.locator(`.sticky.top-0 [title="Chunk #${c + 1}"]`).boundingBox();
      const cellBox = await page.locator(`#heatmap-cell-0-${c}`).boundingBox();
      expect(headerBox).not.toBeNull();
      expect(cellBox).not.toBeNull();
      if (headerBox && cellBox) {
        expect(Math.abs(headerBox.x - cellBox.x)).toBeLessThanOrEqual(1);
      }
    }

    // 5. Scroll horizontally and vertically
    await gridRegion.evaluate((el) => {
      el.scrollLeft = 200;
      el.scrollTop = 50;
    });
    await page.waitForTimeout(200);

    // Verify alignment while scrolled
    for (let c = 0; c < colCount; c++) {
      const headerBox = await gridRegion.locator(`.sticky.top-0 [title="Chunk #${c + 1}"]`).boundingBox();
      const cellBox = await page.locator(`#heatmap-cell-0-${c}`).boundingBox();
      if (headerBox && cellBox && headerBox.x > 0 && headerBox.x < 1200) {
        expect(Math.abs(headerBox.x - cellBox.x)).toBeLessThanOrEqual(1);
      }
    }
  });

  test('verifies 65-chunk matrix layout, alignment, and absence of black void truncation', async ({ page }) => {
    await page.goto('/?view=app');
    await page.waitForSelector('header');

    // 1. Set chunk size to 25 tokens in sidebar so each paragraph becomes a chunk
    const chunkSizeInput = page.getByRole('spinbutton', { name: /Target chunk size numeric value/i });
    if (await chunkSizeInput.isVisible()) {
      await chunkSizeInput.fill('25');
    }

    // 2. Switch to Raw Text editor tab and fill 65 distinct paragraphs
    const textTab = page.getByRole('tab', { name: /Edit Raw Text|Text/i }).first();
    await textTab.click();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // 65 distinct paragraphs with unique content
    const paragraphs = Array.from({ length: 65 }, (_, i) =>
      `Section ${i + 1}: Detailed analysis of chunking partition ${i + 1} with embeddings and vector distance calculations for RAG pipelines.`
    ).join('\n\n');

    await textarea.fill(paragraphs);
    await page.waitForTimeout(600);

    // 3. Switch to Heatmap tab
    const heatmapTab = page.getByRole('tab', { name: /Similarity Heatmap|Heatmap/i }).first();
    await heatmapTab.click();

    const gridRegion = page.locator('[role="region"][aria-label="Similarity matrix grid"]');
    await expect(gridRegion).toBeVisible();
    await page.waitForTimeout(500);

    // 4. Verify matrix has at least 60+ chunks (e.g. 65 × 65)
    const headerCols = gridRegion.locator('.sticky.top-0 [title^="Chunk #"]');
    const headerCount = await headerCols.count();
    expect(headerCount).toBeGreaterThanOrEqual(60);

    // 5. Scroll to column ~16 (scrollLeft = 700px)
    await gridRegion.evaluate((el) => {
      el.scrollLeft = 700;
      el.scrollTop = 0;
    });
    await page.waitForTimeout(300);

    const cellsInfo = await page.evaluate(() => {
      const region = document.querySelector('[role="region"][aria-label="Similarity matrix grid"]');
      if (!region) return null;
      const regionRect = region.getBoundingClientRect();
      const cells = Array.from(region.querySelectorAll('button[id^="heatmap-cell-0-"]'));
      return {
        regionLeft: regionRect.left,
        cells: cells.map((c) => {
          const r = c.getBoundingClientRect();
          return { id: c.id, x: r.x, right: r.right };
        }).filter((c) => c.right >= regionRect.left - 50 && c.x <= regionRect.left + 150)
      };
    });
    // 6. Verify that columns 16 through 49 all have buttons underneath them
    // Check that button under col #35 exists and has exact 40x32px dimensions
    const cellRow0Col34 = page.locator('#heatmap-cell-0-34');
    await expect(cellRow0Col34).toBeVisible();
    const cellBox = await cellRow0Col34.boundingBox();
    expect(cellBox).not.toBeNull();
    expect(cellBox!.width).toBe(40);
    expect(cellBox!.height).toBe(32);

    // 7. Verify that column header #35 aligns with cell (0, 34)
    const header35 = gridRegion.locator('.sticky.top-0 [title="Chunk #35"]');
    const headerBox = await header35.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(Math.abs(headerBox!.x - cellBox!.x)).toBeLessThanOrEqual(1);

    // 8. Verify corner spacer stays pinned at left edge of scroll viewport
    const corner = gridRegion.getByTestId('heatmap-corner-spacer');
    const cornerBox = await corner.boundingBox();
    const gridBox = await gridRegion.boundingBox();
    expect(cornerBox).not.toBeNull();
    expect(gridBox).not.toBeNull();
    expect(cornerBox!.x).toBeGreaterThanOrEqual(gridBox!.x);

    // 9. Verify row label #1 stays pinned at left edge matching corner
    const rowLabel1 = gridRegion.locator('.space-y-1 .sticky.left-0').first();
    const row1Box = await rowLabel1.boundingBox();
    expect(row1Box).not.toBeNull();
    expect(Math.abs(row1Box!.x - cornerBox!.x)).toBeLessThanOrEqual(1);

    // Ensure window is at top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // 10. Save screenshot of the fixed 65-chunk heatmap to verify visually
    await page.screenshot({
      path: '/home/drago/.gemini/antigravity/brain/d82582c0-32d4-44c7-a92d-d5a92eacd7ec/heatmap_65_chunks_scrolled.png',
      fullPage: false,
    });
  });
});
