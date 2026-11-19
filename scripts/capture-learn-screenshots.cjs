const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const OUT_DIR = path.resolve(__dirname, '../docs/design/learn');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
  console.log('[Screenshots] Starting preview server...');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
  });

  // Wait for preview server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const executablePath = process.env.PW_CHROME_PATH || undefined;
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
  });

  try {
    // 1. Desktop Curriculum Map (Dark, 1440x900)
    console.log('[Screenshots] Capturing 01-curriculum-map-desktop-1440-dark.png...');
    const context1 = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    });
    const page1 = await context1.newPage();
    await page1.goto('http://127.0.0.1:4173/?view=learn', { waitUntil: 'networkidle' });
    await page1.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chunklens_theme', 'dark');
    });
    await page1.waitForTimeout(500);
    await page1.screenshot({
      path: path.join(OUT_DIR, '01-curriculum-map-desktop-1440-dark.png'),
      fullPage: false,
    });
    await context1.close();

    // 2. Mobile Curriculum Map (Light, 375x812)
    console.log('[Screenshots] Capturing 02-curriculum-map-mobile-375-light.png...');
    const context2 = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
    });
    const page2 = await context2.newPage();
    await page2.goto('http://127.0.0.1:4173/?view=learn', { waitUntil: 'networkidle' });
    await page2.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chunklens_theme', 'light');
    });
    await page2.waitForTimeout(500);
    await page2.screenshot({
      path: path.join(OUT_DIR, '02-curriculum-map-mobile-375-light.png'),
      fullPage: false,
    });
    await context2.close();

    // 3. Lesson 1.1 V1 Pipeline Explorer (Dark, 1440x1000)
    console.log('[Screenshots] Capturing 03-lesson-1-1-v1-pipeline-desktop-dark.png...');
    const context3 = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'dark',
    });
    const page3 = await context3.newPage();
    await page3.goto('http://127.0.0.1:4173/?view=learn&lesson=1-1-what-is-rag', { waitUntil: 'networkidle' });
    await page3.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chunklens_theme', 'dark');
    });
    await page3.waitForTimeout(600);
    // Scroll to the pipeline simulator
    const v1Title = page3.getByText('RAG Pipeline Flow Simulator');
    if (await v1Title.isVisible()) {
      await v1Title.scrollIntoViewIfNeeded();
      await page3.waitForTimeout(300);
    }
    await page3.screenshot({
      path: path.join(OUT_DIR, '03-lesson-1-1-v1-pipeline-desktop-dark.png'),
      fullPage: false,
    });
    await context3.close();

    // 4. Lesson 3.2 V2 Sandbox (Dark, 1440x1100)
    console.log('[Screenshots] Capturing 04-lesson-3-2-v2-sandbox-desktop-dark.png...');
    const context4 = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      colorScheme: 'dark',
    });
    const page4 = await context4.newPage();
    await page4.goto('http://127.0.0.1:4173/?view=learn&lesson=3-2-the-size-trade-off', { waitUntil: 'networkidle' });
    await page4.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chunklens_theme', 'dark');
    });
    await page4.waitForTimeout(600);
    const v2Title = page4.getByText('Live Document Chunking Sandbox');
    if (await v2Title.isVisible()) {
      await v2Title.scrollIntoViewIfNeeded();
      await page4.waitForTimeout(300);
    }
    await page4.screenshot({
      path: path.join(OUT_DIR, '04-lesson-3-2-v2-sandbox-desktop-dark.png'),
      fullPage: false,
    });
    await context4.close();

    // 5. Quiz Feedback Accessible (Dark, 1440x1000)
    console.log('[Screenshots] Capturing 05-quiz-feedback-accessible-desktop-dark.png...');
    const context5 = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'dark',
    });
    const page5 = await context5.newPage();
    await page5.goto('http://127.0.0.1:4173/?view=learn&lesson=1-1-what-is-rag', { waitUntil: 'networkidle' });
    await page5.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chunklens_theme', 'dark');
    });
    await page5.waitForTimeout(600);
    // Find quiz button and click an option
    const quizOption = page5.locator('button:has-text("Embedding and vector retrieval")').first();
    if (await quizOption.isVisible()) {
      await quizOption.scrollIntoViewIfNeeded();
      await quizOption.click();
      await page5.waitForTimeout(400);
    }
    await page5.screenshot({
      path: path.join(OUT_DIR, '05-quiz-feedback-accessible-desktop-dark.png'),
      fullPage: false,
    });
    await context5.close();

    console.log('[Screenshots PASS] All 5 screenshots captured successfully in docs/design/learn/');
  } finally {
    await browser.close();
    preview.kill();
  }
}

main().catch((err) => {
  console.error('[Screenshots FAIL]', err);
  process.exit(1);
});
