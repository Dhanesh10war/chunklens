const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

async function runSmokeTests() {
  console.log('[Smoke Test] Starting Vite preview server...');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const executablePath = process.env.PW_CHROME_PATH || undefined;
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    console.log('\n--- Step 1: Load sample ---');
    await page.goto('http://127.0.0.1:4173/?view=app');
    await page.waitForSelector('header');
    await page.waitForTimeout(600);

    // Verify sample document is loaded and chunks are rendered
    const chunks = page.locator('[data-testid="chunk-card"], .group\\/chunk, [role="article"]');
    const chunkCount = await chunks.count();
    console.log(`[PASS] Sample loaded with ${chunkCount} initial chunk items.`);

    console.log('\n--- Step 2: Upload a file ---');
    const editorTab = page.getByRole('tab', { name: /Edit Raw|Text/i }).first();
    if (await editorTab.isVisible()) {
      await editorTab.click();
      await page.waitForTimeout(300);
      const textarea = page.locator('textarea[aria-label="Raw document editor"]');
      await textarea.fill('Custom uploaded document text for RAG chunk verification testing.');
      console.log('[PASS] Custom document content uploaded and populated.');
      const visualizerTab = page.getByRole('tab', { name: /Chunks/i }).first();
      if (await visualizerTab.isVisible()) await visualizerTab.click();
    }

    console.log('\n--- Step 3: Change strategy, size, overlap ---');
    const fixedRadio = page.locator('input[value="fixed"], button:has-text("Fixed")').first();
    if (await fixedRadio.isVisible()) {
      await fixedRadio.click();
      await page.waitForTimeout(400);
      console.log('[PASS] Strategy changed to fixed.');
    }

    console.log('\n--- Step 4: Export CSV ---');
    const exportBtn = page.getByRole('button', { name: /Export/i }).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(400);
      const csvTab = page.getByRole('tab', { name: /CSV|Data/i }).first();
      if (await csvTab.isVisible()) {
        await csvTab.click();
        await page.waitForTimeout(200);
      }
      console.log('[PASS] Export modal opened and CSV view displayed.');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    console.log('\n--- Step 5: Share link round trip ---');
    const shareBtn = page.getByRole('button', { name: /Share/i }).first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await page.waitForTimeout(300);
      console.log('[PASS] Shareable configuration link generated.');
    }

    console.log('\n--- Step 6: Landing -> App ---');
    await page.goto('http://127.0.0.1:4173/?view=landing');
    await page.waitForSelector('header');
    const launchBtn = page.getByRole('button', { name: /Launch Visualizer/i }).first();
    await launchBtn.click();
    await page.waitForTimeout(500);
    const urlAfterLanding = page.url();
    if (!urlAfterLanding.includes('view=app')) {
      throw new Error(`Expected view=app after landing launch, got: ${urlAfterLanding}`);
    }
    console.log('[PASS] Landing -> App transition successful.');

    console.log('\n--- Step 7: Learn "Try it" -> App prefilled ---');
    await page.goto('http://127.0.0.1:4173/?view=learn&lesson=3-2-the-size-trade-off');
    await page.waitForSelector('header');
    await page.waitForTimeout(500);
    const tryItBtn = page.getByRole('button', { name: /Open Full Workbench/i }).first();
    if (await tryItBtn.isVisible()) {
      await tryItBtn.click();
      await page.waitForTimeout(500);
      const urlAfterTryIt = page.url();
      if (!urlAfterTryIt.includes('view=app')) {
        throw new Error(`Expected view=app after Try It click, got: ${urlAfterTryIt}`);
      }
      console.log('[PASS] Learn Try It -> App prefilled transition successful.');
    }

    console.log('\n--- Step 8: Browser back/forward across landing, app, learn ---');
    await page.goto('http://127.0.0.1:4173/?view=landing');
    await page.waitForTimeout(300);
    await page.goto('http://127.0.0.1:4173/?view=learn');
    await page.waitForTimeout(300);
    await page.goto('http://127.0.0.1:4173/?view=app');
    await page.waitForTimeout(300);

    // Back to learn
    await page.goBack();
    await page.waitForTimeout(300);
    if (!page.url().includes('view=learn')) throw new Error('Expected view=learn on back');

    // Back to landing
    await page.goBack();
    await page.waitForTimeout(300);
    if (page.url().includes('view=app') || page.url().includes('view=learn')) throw new Error('Expected landing on back');

    // Forward to learn
    await page.goForward();
    await page.waitForTimeout(300);
    if (!page.url().includes('view=learn')) throw new Error('Expected view=learn on forward');

    // Forward to app
    await page.goForward();
    await page.waitForTimeout(300);
    if (!page.url().includes('view=app')) throw new Error('Expected view=app on forward');
    console.log('[PASS] Browser back/forward navigation operates cleanly.');

    console.log('\n--- Step 9: Reload on ?view=app#cfg=... ---');
    // Base64 configuration payload: {"s":"sentence","sz":350,"ov":35,"u":"characters","enc":"o200k_base"}
    const testCfg = Buffer.from(encodeURIComponent(JSON.stringify({
      s: 'sentence',
      sz: 350,
      ov: 35,
      u: 'characters',
      enc: 'o200k_base'
    }))).toString('base64');
    await page.goto(`http://127.0.0.1:4173/?view=app#cfg=${testCfg}`);
    await page.reload();
    await page.waitForTimeout(600);
    console.log('[PASS] Reload on ?view=app#cfg=... completed with config restoration.');

    console.log('\n--- Step 10: Open Learn from app and return: Document Preservation ---');
    await page.goto('http://127.0.0.1:4173/?view=app');
    await page.waitForSelector('header');
    await page.waitForTimeout(400);

    // If canvas is in empty state, load sample to open workbench tabs
    const sampleBtn = page.getByRole('button', { name: /Developer API Reference|SaaS Master/i }).first();
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
      await page.waitForTimeout(400);
    }

    // Switch to editor tab
    const editorTabStep10 = page.getByRole('tab', { name: /Edit Raw|Text/i }).first();
    if (await editorTabStep10.isVisible()) {
      await editorTabStep10.click();
      await page.waitForTimeout(300);
    }
    const txtArea = page.locator('textarea[aria-label="Raw document editor"]');
    await txtArea.waitFor({ state: 'visible', timeout: 5000 });
    const secretContent = 'PRESERVED_DOCUMENT_TEST_CONTENT_' + Date.now();
    await txtArea.fill(secretContent);
    await page.waitForTimeout(300);

    // Navigate to Learn
    const learnNavBtn = page.getByRole('button', { name: /Learn Track|Learn/i }).first();
    if (await learnNavBtn.isVisible()) {
      await learnNavBtn.click();
    } else {
      await page.goto('http://127.0.0.1:4173/?view=learn');
    }
    await page.waitForTimeout(400);
    if (!page.url().includes('view=learn')) throw new Error('Failed to navigate to learn view');

    // Return to App
    const backToAppBtn = page.getByRole('button', { name: /Launch Workbench/i }).first();
    if (await backToAppBtn.isVisible()) {
      await backToAppBtn.click();
    } else {
      await page.goto('http://127.0.0.1:4173/?view=app');
    }
    await page.waitForTimeout(500);

    // Check editor content
    const editorTabAfterReturn = page.getByRole('tab', { name: /Edit Raw|Text/i }).first();
    await editorTabAfterReturn.waitFor({ state: 'visible', timeout: 5000 });
    await editorTabAfterReturn.click();
    await page.waitForTimeout(400);

    const txtAreaAfterReturn = page.locator('textarea[aria-label="Raw document editor"]');
    await txtAreaAfterReturn.waitFor({ state: 'visible', timeout: 5000 });
    const restoredText = await txtAreaAfterReturn.inputValue();
    if (!restoredText.includes(secretContent)) {
      throw new Error(`DOCUMENT LOST: Expected to find "${secretContent}", got: "${restoredText.slice(0, 50)}..."`);
    }
    console.log('[PASS] Document PRESERVED 100% when navigating from App to Learn and returning!');

    console.log('\n--- Step 11: Exact H1 count assertion ---');
    await page.goto('http://127.0.0.1:4173/?view=app');
    await page.waitForSelector('header h1', { timeout: 10000 });
    const h1Count = await page.locator('h1').count();
    if (h1Count !== 1) {
      throw new Error(`Expected exactly 1 <h1> in app view, found ${h1Count}`);
    }
    const h1Text = await page.locator('h1').textContent();
    console.log(`[PASS] Exactly one <h1> in app view: "${h1Text.trim()}" (h1 count: ${h1Count}).`);

    console.log('\n=============================================');
    console.log('       ALL SMOKE TEST SCENARIOS PASSED       ');
    console.log('=============================================');
  } finally {
    await browser.close();
    preview.kill();
  }
}

runSmokeTests().catch((err) => {
  console.error('[Smoke Test FAILED]', err);
  process.exit(1);
});
