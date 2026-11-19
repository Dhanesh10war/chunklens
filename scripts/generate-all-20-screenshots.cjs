const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const OUT_DIR = path.resolve(__dirname, '../docs/design/learn');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
  console.log('[20 Screenshots] Starting Vite preview server...');
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

  const targets = [
    { id: 'curriculum-map', path: '/?view=learn', selector: 'header' },
    { id: 'lesson-1-1', path: '/?view=learn&lesson=1-1-what-is-rag', selector: 'h1' },
    { id: 'lesson-3-2', path: '/?view=learn&lesson=3-2-the-size-trade-off', selector: 'h1' },
    { id: 'v1-pipeline', path: '/?view=learn&lesson=1-1-what-is-rag', scrollTo: 'RAG Pipeline Flow Simulator' },
    { id: 'v2-sandbox', path: '/?view=learn&lesson=3-2-the-size-trade-off', scrollTo: 'Live Document Chunking Sandbox' },
  ];

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '375', width: 375, height: 812 },
  ];

  const themes = ['dark', 'light'];

  let count = 0;
  for (const t of targets) {
    for (const vp of viewports) {
      for (const th of themes) {
        count++;
        const filename = `${String(count).padStart(2, '0')}-${t.id}-${vp.name}-${th}.png`;
        const dest = path.join(OUT_DIR, filename);

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: th,
        });
        const page = await context.newPage();

        await page.goto(`http://127.0.0.1:4173${t.path}`, { waitUntil: 'networkidle' });
        await page.evaluate((theme) => {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('chunklens_theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('chunklens_theme', 'light');
          }
        }, th);
        await page.waitForTimeout(400);

        if (t.scrollTo) {
          const el = page.getByText(t.scrollTo).first();
          if (await el.isVisible()) {
            await el.scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);
          }
        }

        await page.screenshot({ path: dest, fullPage: false });
        console.log(`[Screenshot ${count}/20] Saved ${filename}`);
        await context.close();
      }
    }
  }

  await browser.close();
  preview.kill();
  console.log('[20 Screenshots PASS] All 20 visual artifacts generated in docs/design/learn/');
}

main().catch((err) => {
  console.error('[20 Screenshots FAIL]', err);
  process.exit(1);
});
