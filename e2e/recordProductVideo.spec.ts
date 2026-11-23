import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.use({
  video: {
    mode: 'on',
    size: { width: 1920, height: 1080 },
  },
  viewport: { width: 1920, height: 1080 },
});

test('cinematic product demo recording', async ({ page }, testInfo) => {
  test.setTimeout(90000); // 90s budget for smooth high-res recording

  // Helper for human-like smooth mouse movement
  const smoothMouseMove = async (targetX: number, targetY: number, steps = 25) => {
    await page.mouse.move(targetX, targetY, { steps });
    await page.waitForTimeout(150);
  };

  // ==========================================
  // SCENE 1: LANDING PAGE HERO & VALUE PROP
  // ==========================================
  await page.goto('/');
  await page.waitForSelector('nav');
  await page.waitForTimeout(1000);

  // Smooth scroll through landing page
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
  await page.waitForTimeout(1500);

  // Scroll to strategy matrix
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await page.waitForTimeout(1800);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(1200);

  // ==========================================
  // SCENE 2: LAUNCH WORKBENCH & REAL-TIME CHUNKING
  // ==========================================
  const launchBtn = page.getByRole('button', { name: /Launch Visualizer|Launch Workbench/i }).first();
  const launchBox = await launchBtn.boundingBox();
  if (launchBox) {
    await smoothMouseMove(launchBox.x + launchBox.width / 2, launchBox.y + launchBox.height / 2);
    await page.waitForTimeout(300);
  }
  await launchBtn.click();
  await page.waitForSelector('header');
  await page.waitForTimeout(1200);

  // Switch to a sample document
  const sampleDoc = page.getByRole('button', { name: /SaaS Master Subscription Agreement|Developer API Reference/i }).first();
  if (await sampleDoc.isVisible()) {
    const docBox = await sampleDoc.boundingBox();
    if (docBox) {
      await smoothMouseMove(docBox.x + docBox.width / 2, docBox.y + docBox.height / 2);
    }
    await sampleDoc.click();
    await page.waitForTimeout(1500);
  }

  // Adjust chunk size slider
  const chunkSizeSlider = page.locator('input[type="range"]').first();
  if (await chunkSizeSlider.isVisible()) {
    const sliderBox = await chunkSizeSlider.boundingBox();
    if (sliderBox) {
      await smoothMouseMove(sliderBox.x + sliderBox.width * 0.7, sliderBox.y + sliderBox.height / 2);
      await page.mouse.down();
      await smoothMouseMove(sliderBox.x + sliderBox.width * 0.3, sliderBox.y + sliderBox.height / 2, 15);
      await page.mouse.up();
      await page.waitForTimeout(1200);
    }
  }

  // ==========================================
  // SCENE 3: TOKENIZER SELECTION & COST CALC
  // ==========================================
  const tokenizerBtn = page.getByRole('button', { name: /Tokenizer/i }).first();
  if (await tokenizerBtn.isVisible()) {
    const tokBox = await tokenizerBtn.boundingBox();
    if (tokBox) {
      await smoothMouseMove(tokBox.x + tokBox.width / 2, tokBox.y + tokBox.height / 2);
    }
    await tokenizerBtn.click();
    await page.waitForTimeout(1800);

    // Close modal
    const closeBtn = page.getByRole('button', { name: /Close|Done|✕/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(800);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
  }

  // ==========================================
  // SCENE 4: SIMILARITY HEATMAP & CONTINUITY
  // ==========================================
  const heatmapTab = page.getByRole('tab', { name: /Similarity Heatmap|Heatmap/i }).first();
  if (await heatmapTab.isVisible()) {
    const heatBox = await heatmapTab.boundingBox();
    if (heatBox) {
      await smoothMouseMove(heatBox.x + heatBox.width / 2, heatBox.y + heatBox.height / 2);
    }
    await heatmapTab.click();
    await page.waitForTimeout(1500);

    // Hover over sparkline and several heatmap cells
    const gridRegion = page.locator('[role="region"][aria-label="Similarity matrix grid"]');
    if (await gridRegion.isVisible()) {
      const cells = gridRegion.locator('button[id^="heatmap-cell-"]');
      const count = await cells.count();
      if (count > 0) {
        for (let i = 0; i < Math.min(6, count); i += 2) {
          const cellBox = await cells.nth(i).boundingBox();
          if (cellBox) {
            await smoothMouseMove(cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height / 2, 10);
            await page.waitForTimeout(400);
          }
        }
      }

      // Smooth horizontal scroll of the heatmap
      await gridRegion.evaluate((el) => {
        el.scrollTo({ left: 350, behavior: 'smooth' });
      });
      await page.waitForTimeout(1500);

      await gridRegion.evaluate((el) => {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      });
      await page.waitForTimeout(1000);
    }
  }

  // ==========================================
  // SCENE 5: RAG ACADEMY (LEARN TRACK)
  // ==========================================
  const learnLink = page.getByRole('button', { name: /RAG Academy|Learn/i }).first();
  if (await learnLink.isVisible()) {
    const learnBox = await learnLink.boundingBox();
    if (learnBox) {
      await smoothMouseMove(learnBox.x + learnBox.width / 2, learnBox.y + learnBox.height / 2);
    }
    await learnLink.click();
    await page.waitForTimeout(1500);

    // Scroll through curriculum
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(1200);

    // Open first lesson
    const firstLesson = page.locator('text=0.1 The Mental Model of Chunking').first();
    if (await firstLesson.isVisible()) {
      await firstLesson.click();
      await page.waitForTimeout(1500);

      // Scroll lesson text down to interactive widget
      await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));
      await page.waitForTimeout(1500);
    }
  }

  // ==========================================
  // SCENE 6: PRO / ENTERPRISE WAITLIST MODAL
  // ==========================================
  const proBtn = page.getByRole('button', { name: /Pro|Upgrade/i }).first();
  if (await proBtn.isVisible()) {
    const proBox = await proBtn.boundingBox();
    if (proBox) {
      await smoothMouseMove(proBox.x + proBox.width / 2, proBox.y + proBox.height / 2);
    }
    await proBtn.click();
    await page.waitForTimeout(2000);
  }

  // End pause
  await page.waitForTimeout(1500);

  // Video is saved on context close
});
