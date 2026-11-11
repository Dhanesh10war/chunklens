const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/home/drago/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome';
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUT_DIR = path.resolve(__dirname, '../docs/design/before');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

function createStaticServer(port = 8080) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const indexPath = path.join(DIST_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`Static server running at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(new Error(msg.error.message));
      else cb.resolve(msg.result);
    }
  });

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  return new Promise((resolve) => {
    ws.addEventListener('open', () => resolve({ send, close: () => ws.close() }));
  });
}

async function capture(client, filename, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await new Promise((r) => setTimeout(r, 600));
  const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
  const filePath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  console.log(`Saved screenshot: ${filename} (${width}x${height})`);
}

async function run() {
  const server = await createStaticServer(8080);

  const chrome = spawn(CHROME_PATH, [
    '--headless',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/cdp-baseline-profile-' + Date.now(),
    'http://127.0.0.1:8080/',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const targets = await getJson('http://127.0.0.1:9222/json');
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = await createCdpClient(pageTarget.webSocketDebuggerUrl);
    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('CSS.enable');

    // Wait for initial render of sample chunks
    await new Promise((r) => setTimeout(r, 1500));

    console.log('Capturing Loaded state screenshots (1440, 1024, 768, 375)...');
    const viewports = [
      { name: '1440', w: 1440, h: 900 },
      { name: '1024', w: 1024, h: 768 },
      { name: '768', w: 768, h: 1024 },
      { name: '375', w: 375, h: 812 },
    ];

    // 1. Loaded state
    for (const vp of viewports) {
      await capture(client, `loaded_${vp.name}.png`, vp.w, vp.h);
    }

    // 2. Empty state
    console.log('Capturing Empty state screenshots...');
    await client.send('Runtime.evaluate', {
      expression: `
        const editTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Edit Raw Text'));
        if (editTab) editTab.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 400));
    await client.send('Runtime.evaluate', {
      expression: `
        const ta = document.querySelector('textarea');
        if (ta) {
          ta.value = '';
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const chunksTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chunks'));
        if (chunksTab) chunksTab.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    for (const vp of viewports) {
      await capture(client, `empty_${vp.name}.png`, vp.w, vp.h);
    }

    // 3. Error state (simulate unreadable document / error alert banner)
    console.log('Capturing Error state screenshots...');
    await client.send('Runtime.evaluate', {
      expression: `
        const banner = document.createElement('div');
        banner.id = 'demo-error-banner';
        banner.className = 'mx-6 my-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md text-xs flex items-center justify-between font-mono';
        banner.innerHTML = '<span><strong>Error:</strong> Failed to extract text from document "Java_Full_Notes.pdf": File corrupted or unreadable.</span><button onclick="this.parentElement.remove()" style="padding: 2px 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">Retry</button>';
        const main = document.querySelector('main');
        if (main) main.insertBefore(banner, main.firstChild);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    for (const vp of viewports) {
      await capture(client, `error_${vp.name}.png`, vp.w, vp.h);
    }

    // 4. Run Accessibility & CSS Metrics Audit on actual rendered DOM
    console.log('Extracting CSS & Accessibility Metrics from live DOM...');
    const auditResult = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const colors = new Set();
        const fontSizes = new Set();
        const borderRadii = new Set();
        const spacings = new Set();

        allElements.forEach(el => {
          const s = window.getComputedStyle(el);
          if (s.color) colors.add(s.color);
          if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') colors.add(s.backgroundColor);
          if (s.borderColor && s.borderColor !== 'rgba(0, 0, 0, 0)') colors.add(s.borderColor);
          if (s.fontSize) fontSizes.add(s.fontSize);
          if (s.borderRadius && s.borderRadius !== '0px') borderRadii.add(s.borderRadius);
          if (s.marginTop && s.marginTop !== '0px') spacings.add(s.marginTop);
          if (s.marginBottom && s.marginBottom !== '0px') spacings.add(s.marginBottom);
          if (s.paddingTop && s.paddingTop !== '0px') spacings.add(s.paddingTop);
          if (s.paddingLeft && s.paddingLeft !== '0px') spacings.add(s.paddingLeft);
          if (s.gap && s.gap !== 'normal') spacings.add(s.gap);
        });

        // Accessibility checks (axe baseline equivalent)
        const a11yViolations = [];
        
        // Buttons without accessible name
        document.querySelectorAll('button').forEach(btn => {
          const name = btn.getAttribute('aria-label') || btn.innerText.trim() || btn.getAttribute('title');
          if (!name) {
            a11yViolations.push({ id: 'button-name', node: btn.outerHTML.slice(0, 80) });
          }
        });

        // Inputs without associated label
        document.querySelectorAll('input, select, textarea').forEach(inp => {
          const id = inp.id;
          const label = id ? document.querySelector('label[for="' + id + '"]') : null;
          const ariaLabel = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
          if (!label && !ariaLabel && inp.type !== 'hidden') {
            a11yViolations.push({ id: 'label', node: inp.outerHTML.slice(0, 80) });
          }
        });

        const fontStacks = new Set(allElements.map(el => window.getComputedStyle(el).fontFamily));

        return {
          totalDomNodes: allElements.length,
          distinctColorsCount: colors.size,
          distinctColors: Array.from(colors),
          distinctFontSizesCount: fontSizes.size,
          distinctFontSizes: Array.from(fontSizes).sort(),
          distinctBorderRadiiCount: borderRadii.size,
          distinctBorderRadii: Array.from(borderRadii),
          distinctSpacingsCount: spacings.size,
          distinctSpacings: Array.from(spacings),
          fontStacks: Array.from(fontStacks),
          a11yViolationsCount: a11yViolations.length,
          a11yViolations: a11yViolations,
          pageTitle: document.title
        };
      })()`,
      returnByValue: true,
    });

    const metrics = auditResult.result.value;
    console.log('Audit Summary:', {
      pageTitle: metrics.pageTitle,
      totalDomNodes: metrics.totalDomNodes,
      distinctColorsCount: metrics.distinctColorsCount,
      distinctFontSizesCount: metrics.distinctFontSizesCount,
      distinctBorderRadiiCount: metrics.distinctBorderRadiiCount,
      distinctSpacingsCount: metrics.distinctSpacingsCount,
      a11yViolationsCount: metrics.a11yViolationsCount,
    });

    fs.writeFileSync(
      path.join(OUT_DIR, 'baseline-metrics.json'),
      JSON.stringify(metrics, null, 2)
    );

    client.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch((err) => {
  console.error('Capture baseline failed:', err);
  process.exit(1);
});
