const { spawn } = require('child_process');
const { chromium } = require('@playwright/test');
const os = require('os');
const path = require('path');
const fs = require('fs');

const fallbackChrome = path.join(
  os.homedir(),
  '.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome'
);
const executablePath =
  process.env.PW_CHROME_PATH ||
  (fs.existsSync(fallbackChrome) ? fallbackChrome : undefined);

async function runBenchmark() {
  console.log('--- Starting Compatibility Performance Benchmark ---');

  // 1. Start Preview Server
  const port = 4190;
  const viteBin = path.resolve(__dirname, '../node_modules/.bin/vite');
  const preview = spawn(viteBin, ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  await new Promise((resolve, reject) => {
    preview.stdout.on('data', (d) => {
      if (d.toString().includes(`127.0.0.1:${port}`)) resolve();
    });
    preview.stderr.on('data', (d) => {
      console.error('preview stderr:', d.toString());
    });
    preview.on('error', reject);
  });

  console.log(`Preview server running on 127.0.0.1:${port}`);

  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  const page = await context.newPage();

  // Setup CDP Session for 4x CPU Throttling and Slow 4G Simulation
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // ~1.6 Mbps
    uploadThroughput: (750 * 1024) / 8,          // ~750 kbps
  });

  // Inject Web Vitals & Long Tasks Observer
  await page.addInitScript(() => {
    window.__perf = {
      lcp: 0,
      cls: 0,
      longTasks: [],
      interactionLatencies: [],
    };

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        window.__perf.lcp = entries[entries.length - 1].startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__perf.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__perf.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  // ----------------------------------------------------
  // BENCHMARK 1: Landing Page LCP, CLS & Tab Switch Sequence
  // ----------------------------------------------------
  console.log('\nMeasuring Landing Page on Throttled Profile...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Scripted Interaction Sequence: Open Drawer (if present on mobile), Cycle All Tabs
  const menuBtn = page.getByRole('button', { name: 'Open menu' });
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await page.waitForTimeout(300);
  }

  const tabNames = ['Features & Engine', 'Use Cases', 'Zero-Egress Security', 'Docs & API', 'Overview'];
  for (const name of tabNames) {
    const tabBtn = page.getByRole('button', { name, exact: true }).first();
    if (await tabBtn.isVisible()) {
      const t0 = performance.now();
      await tabBtn.click();
      await page.waitForTimeout(200);
      const latency = performance.now() - t0;
      await page.evaluate((l) => window.__perf.interactionLatencies.push({ action: 'landing-tab-switch', latency: l }), latency);
    }
  }

  const landingPerf = await page.evaluate(() => {
    const longest = window.__perf.longTasks.reduce((max, t) => Math.max(max, t.duration), 0);
    const tabLatencies = window.__perf.interactionLatencies.filter(i => i.action === 'landing-tab-switch');
    return {
      lcp: Math.round(window.__perf.lcp),
      cls: Number(window.__perf.cls.toFixed(4)),
      longestTaskMs: Math.round(longest),
      avgTabLatencyMs: Math.round(
        tabLatencies.reduce((sum, item) => sum + item.latency, 0) / (tabLatencies.length || 1)
      ),
    };
  });
  console.log('Landing Page Results:', landingPerf);

  // ----------------------------------------------------
  // BENCHMARK 2: Workbench Interaction Sequence (Sample Load, Tab Switch, Slider Drag)
  // ----------------------------------------------------
  console.log('\nMeasuring Workbench Interaction Sequence & Latency...');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`http://127.0.0.1:${port}/?view=app`, { waitUntil: 'networkidle' });
  await page.waitForSelector('header');

  // Clear tracking
  await page.evaluate(() => {
    window.__perf.cls = 0;
    window.__perf.longTasks = [];
    window.__perf.interactionLatencies = [];
  });

  // Scripted sequence: load sample, switch to heatmap, switch to chunks
  const sampleBtn = page.locator('button:has-text("Quarterly Financial")').first();
  if (await sampleBtn.isVisible()) {
    await sampleBtn.click();
    await page.waitForTimeout(400);
  }

  // Measure tab switch latency
  const heatmapTab = page.locator('button[role="tab"]:has-text("Heatmap")').first();
  const tTab0 = performance.now();
  await heatmapTab.click();
  await page.waitForSelector('[role="region"][aria-label="Similarity matrix grid"]');
  const heatmapTabLatency = performance.now() - tTab0;

  const chunksTab = page.locator('button[role="tab"]:has-text("Chunks")').first();
  await chunksTab.click();
  await page.waitForTimeout(300);

  // Slider change latency
  const chunkSizeInput = page.locator('#input-target-chunk-size');
  let sliderLatency = 0;
  if (await chunkSizeInput.isVisible()) {
    const tSlider0 = performance.now();
    await chunkSizeInput.fill('250');
    await chunkSizeInput.dispatchEvent('change');
    await page.waitForTimeout(500);
    sliderLatency = performance.now() - tSlider0;
  }

  const workbenchSeqPerf = await page.evaluate(() => {
    const longest = window.__perf.longTasks.reduce((max, t) => Math.max(max, t.duration), 0);
    return {
      cls: Number(window.__perf.cls.toFixed(4)),
      longestTaskMs: Math.round(longest),
    };
  });
  console.log('Workbench Interaction Sequence Results:', {
    ...workbenchSeqPerf,
    heatmapTabLatencyMs: Math.round(heatmapTabLatency),
    sliderLatencyMs: Math.round(sliderLatency),
  });

  // ----------------------------------------------------
  // BENCHMARK 3: Workbench with Large Document (~100k chars, 300+ Chunks)
  // ----------------------------------------------------
  console.log('\nMeasuring Workbench with Large Document (~100k chars, 300+ chunks)...');

  // Generate 350 paragraphs with distinct text, totaling ~105,000 characters
  const paragraphs = [];
  for (let i = 1; i <= 350; i++) {
    paragraphs.push(
      `Paragraph ${i}: Retrieval augmented generation architectures require rigorous chunk partitioning. Boundary analysis across lexical delimiters like double newlines ensures coherent semantic preservation. Vector index manifolds benefit from granular overlap and multi-tokenizer validation.`
    );
  }
  const largeDoc = paragraphs.join('\n\n');
  console.log(`Generated large document: ${largeDoc.length.toLocaleString()} characters, 350 paragraphs.`);

  // Set target chunk size to 50 tokens to guarantee >300 chunks
  if (await chunkSizeInput.isVisible()) {
    await chunkSizeInput.fill('50');
    await chunkSizeInput.dispatchEvent('change');
    await page.waitForTimeout(300);
  }

  // Clear tracking
  await page.evaluate(() => {
    window.__perf.longTasks = [];
  });

  // Ingest via file upload input
  const ingestStart = performance.now();
  const fileInput = page.locator('#file-upload-input');
  await fileInput.setInputFiles({
    name: 'large-benchmark-document.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(largeDoc),
  });

  // Wait until chunk cards render >= 300
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('[id^="chunk-card-"]');
    return cards.length >= 300;
  }, { timeout: 15000 });

  const ingestDuration = Math.round(performance.now() - ingestStart);
  const largeDocChunkCount = await page.evaluate(() => document.querySelectorAll('[id^="chunk-card-"]').length);

  const largeDocLongestTask = await page.evaluate(() => {
    return Math.round(window.__perf.longTasks.reduce((max, t) => Math.max(max, t.duration), 0));
  });

  console.log(`Large document ingested: ${largeDocChunkCount} chunks rendered in ${ingestDuration} ms.`);
  console.log('Large Doc Longest Task:', largeDocLongestTask, 'ms');

  // ----------------------------------------------------
  // BENCHMARK 4: Similarity Heatmap at 150x150
  // ----------------------------------------------------
  console.log('\nMeasuring Similarity Heatmap at 150x150 (from large document capped at 150)...');
  await page.evaluate(() => { window.__perf.longTasks = []; });

  const t150Start = performance.now();
  await heatmapTab.click();
  await page.waitForSelector('[role="region"][aria-label="Similarity matrix grid"]');
  // Wait for cells to render
  await page.waitForSelector('button[title*="similarity"], div[style*="background-color"]');
  await page.waitForTimeout(1000);
  const t150Duration = Math.round(performance.now() - t150Start);

  const heatmap150Metrics = await page.evaluate(() => {
    const longest = window.__perf.longTasks.reduce((max, t) => Math.max(max, t.duration), 0);
    const row0 = document.querySelectorAll('[class*="flex items-center space-x-1"]')[0];
    const cellsPerRow = row0 ? row0.children.length : 0;
    const totalRows = document.querySelectorAll('[class*="flex items-center space-x-1"]').length;
    return {
      cellsPerRow,
      totalRows,
      longestTaskMs: Math.round(longest),
    };
  });
  console.log(`Heatmap 150x150 rendered in ${t150Duration} ms (${heatmap150Metrics.totalRows}x${heatmap150Metrics.cellsPerRow}), Longest Task: ${heatmap150Metrics.longestTaskMs} ms`);

  // ----------------------------------------------------
  // BENCHMARK 5: Similarity Heatmap at 67x67
  // ----------------------------------------------------
  console.log('\nMeasuring Similarity Heatmap at 67x67 via direct session initialization...');
  // Generate text for exactly 67 chunks with fixed chunker (67 x 500 chars = 33,500 chars)
  const chunkUnit = 500;
  let text67 = '';
  for (let i = 1; i <= 67; i++) {
    const prefix = `[Chunk #${String(i).padStart(2, '0')}] `;
    const filler = `Section ${i} vocabulary tokens for similarity matrix calculation across lexical embeddings. `;
    const content = (prefix + filler.repeat(10)).slice(0, chunkUnit);
    text67 += content;
  }

  // Pre-seed localStorage session so workbench loads exactly 67 chunks
  await page.evaluate(({ rawText, chunkSize }) => {
    window.localStorage.setItem('chunklens_session_v1', JSON.stringify({
      selectedSampleId: null,
      documentTitle: 'benchmark-67.txt',
      rawText,
      rememberDocument: true,
      config: {
        strategy: 'fixed',
        chunkSize,
        chunkOverlap: 0,
        unit: 'characters',
        encoding: 'o200k_base',
      },
    }));
  }, { rawText: text67, chunkSize: chunkUnit });

  // Navigate to reload with seeded 67-chunk session
  await page.goto(`http://127.0.0.1:${port}/?view=app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('[id^="chunk-card-"]');
    return cards.length === 67;
  }, { timeout: 15000 });

  const count67 = await page.evaluate(() => document.querySelectorAll('[id^="chunk-card-"]').length);
  console.log(`Seeded session confirmed: ${count67} chunks.`);

  // Measure Heatmap 67x67 render
  await page.evaluate(() => { window.__perf.longTasks = []; });
  const t67Start = performance.now();
  const freshHeatmapTab = page.locator('button[role="tab"]:has-text("Heatmap")').first();
  await freshHeatmapTab.click();
  await page.waitForSelector('[role="region"][aria-label="Similarity matrix grid"]');
  await page.waitForSelector('button[title*="similarity"], div[style*="background-color"]');
  await page.waitForTimeout(1000);
  const t67Duration = Math.round(performance.now() - t67Start);

  const heatmap67Metrics = await page.evaluate(() => {
    const longest = window.__perf.longTasks.reduce((max, t) => Math.max(max, t.duration), 0);
    const row0 = document.querySelectorAll('[class*="flex items-center space-x-1"]')[0];
    const cellsPerRow = row0 ? row0.children.length : 0;
    const totalRows = document.querySelectorAll('[class*="flex items-center space-x-1"]').length;
    return {
      cellsPerRow,
      totalRows,
      longestTaskMs: Math.round(longest),
    };
  });
  console.log(`Heatmap 67x67 rendered in ${t67Duration} ms (${heatmap67Metrics.totalRows}x${heatmap67Metrics.cellsPerRow}), Longest Task: ${heatmap67Metrics.longestTaskMs} ms`);

  // Clean up stored session
  await page.evaluate(() => window.localStorage.removeItem('chunklens_session_v1'));

  await browser.close();
  preview.kill();

  const report = {
    landing: {
      lcp: landingPerf.lcp,
      cls: landingPerf.cls,
      longestTaskMs: landingPerf.longestTaskMs,
      avgTabLatencyMs: landingPerf.avgTabLatencyMs,
    },
    workbench: {
      cls: workbenchSeqPerf.cls,
      longestTaskMs: workbenchSeqPerf.longestTaskMs,
      heatmapTabLatencyMs: Math.round(heatmapTabLatency),
      sliderLatencyMs: Math.round(sliderLatency),
    },
    largeDoc: {
      charCount: largeDoc.length,
      chunkCount: largeDocChunkCount,
      ingestDurationMs: ingestDuration,
      longestTaskMs: largeDocLongestTask,
    },
    heatmap67: {
      renderDurationMs: t67Duration,
      gridDimensions: `${heatmap67Metrics.totalRows}x${heatmap67Metrics.cellsPerRow}`,
      longestTaskMs: heatmap67Metrics.longestTaskMs,
    },
    heatmap150: {
      renderDurationMs: t150Duration,
      gridDimensions: `${heatmap150Metrics.totalRows}x${heatmap150Metrics.cellsPerRow}`,
      longestTaskMs: heatmap150Metrics.longestTaskMs,
    },
  };

  const resultsPath = path.resolve(__dirname, '../docs/benchmark-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(report, null, 2));
  console.log('\n--- Benchmark Completed Successfully. Saved to docs/benchmark-results.json ---');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
