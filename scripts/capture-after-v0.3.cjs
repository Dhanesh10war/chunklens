const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/home/drago/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome';
const DIST_DIR = path.resolve(__dirname, '../dist');
const OUT_DIR = path.resolve(__dirname, '../docs/design/after-v0.3');
const CORRUPT_PDF_PATH = path.resolve(__dirname, '../src/test-fixtures/corrupt.pdf');

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
  '.woff2': 'font/woff2',
};

function createStaticServer(port = 8088) {
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
      console.log(`[Capture] Static server running at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
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
  console.log(`[Screenshot Saved] ${filename} (${width}x${height})`);
}

async function runAudit(client, stateLabel, width, height) {
  const auditRes = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const violations = [];

      // 1. Button accessible name
      document.querySelectorAll('button').forEach(btn => {
        const name = btn.getAttribute('aria-label') || btn.innerText.trim() || btn.getAttribute('title');
        if (!name) {
          violations.push({ rule: 'button-name', node: btn.outerHTML.slice(0, 80), description: 'Button missing accessible name' });
        }
      });

      // 2. Input labels
      document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(inp => {
        const id = inp.id;
        const label = id ? document.querySelector('label[for="' + id + '"]') : null;
        const ariaLabel = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
        if (!label && !ariaLabel) {
          violations.push({ rule: 'label', node: inp.outerHTML.slice(0, 80), description: 'Form control missing label' });
        }
      });

      // 3. Duplicate IDs
      const ids = new Set();
      document.querySelectorAll('[id]').forEach(el => {
        if (ids.has(el.id)) {
          violations.push({ rule: 'duplicate-id', node: el.outerHTML.slice(0, 80), description: 'Duplicate ID: ' + el.id });
        }
        ids.add(el.id);
      });

      // 4. Role validity
      document.querySelectorAll('[role]').forEach(el => {
        const validRoles = ['alert', 'button', 'dialog', 'region', 'tab', 'tablist', 'tabpanel', 'status', 'tooltip', 'banner', 'main', 'complementary', 'navigation', 'search', 'group', 'menu', 'menuitem', 'option', 'listbox', 'combobox'];
        const r = el.getAttribute('role');
        if (!validRoles.includes(r)) {
          violations.push({ rule: 'aria-roles', node: el.outerHTML.slice(0, 80), description: 'Invalid ARIA role: ' + r });
        }
      });

      // 5. Computed 12px text floor check across visible text nodes (Amendment B)
      const sub12Elements = [];
      allElements.forEach(el => {
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          // Only check visible elements
          if (fontSize > 0 && fontSize < 11.99 && style.display !== 'none' && style.visibility !== 'hidden') {
            sub12Elements.push({
              tag: el.tagName,
              text: el.textContent.trim().slice(0, 30),
              fontSize: style.fontSize,
            });
          }
        }
      });

      // 6. Alert banner presence & role
      const alertBanner = document.querySelector('[role="alert"]');

      return {
        state: '${stateLabel}',
        viewport: '${width}x${height}',
        totalDomNodes: allElements.length,
        customDomA11yViolationsCount: violations.length,
        customDomA11yViolations: violations,
        sub12Count: sub12Elements.length,
        sub12Elements,
        hasAlertRole: !!alertBanner,
      };
    })()`,
    returnByValue: true,
  });
  return auditRes.result.value;
}

async function setDrawerState(client, open, width) {
  if (width >= 1024) return; // Docked at desktop
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const isDrawerOpen = !!document.querySelector('aside');
      const shouldOpen = ${open};
      if (shouldOpen && !isDrawerOpen) {
        const toggleBtn = document.querySelector('button[aria-label*="sidebar"]') ||
                          document.querySelector('button[aria-label="Expand sidebar"]');
        if (toggleBtn) toggleBtn.click();
      } else if (!shouldOpen && isDrawerOpen) {
        const closeBtn = document.querySelector('button[aria-label="Close configuration drawer"]') ||
                         document.querySelector('button[aria-label="Collapse sidebar"]');
        if (closeBtn) closeBtn.click();
      }
    })()`,
  });
  await new Promise((r) => setTimeout(r, 400));
}

async function run() {
  const server = await createStaticServer(8088);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--user-data-dir=/tmp/cdp-after-v03-' + Date.now(),
    'http://127.0.0.1:8088/',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const targets = await getJson('http://127.0.0.1:9223/json');
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = await createCdpClient(pageTarget.webSocketDebuggerUrl);
    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // Wait for initial render of sample chunks
    await new Promise((r) => setTimeout(r, 1500));

    console.log('\n--- 1. CAPTURING LOADED STATE (6 images) ---');
    // Desktop >=1024 (docked)
    await capture(client, 'loaded_1440.png', 1440, 900);
    const loadedAudit_1440 = await runAudit(client, 'loaded', 1440, 900);

    await capture(client, 'loaded_1024.png', 1024, 768);

    // Tablet 768 (closed and open)
    await setDrawerState(client, false, 768);
    await capture(client, 'loaded_768_closed.png', 768, 1024);
    await setDrawerState(client, true, 768);
    await capture(client, 'loaded_768_open.png', 768, 1024);

    // Mobile 375 (closed and open)
    await setDrawerState(client, false, 375);
    await capture(client, 'loaded_375_closed.png', 375, 812);
    const loadedAudit_375 = await runAudit(client, 'loaded', 375, 812);

    await setDrawerState(client, true, 375);
    await capture(client, 'loaded_375_open.png', 375, 812);

    console.log('\n--- 2. TRIGGERING REAL EMPTY STATE VIA "NEW DOCUMENT" BUTTON ---');
    // Open drawer if on small screen to reach "New Document" button or click via header/sidebar
    await setDrawerState(client, true, 375);
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const newDocBtn = document.querySelector('button[aria-label*="New document"]') ||
                          Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Document'));
        if (newDocBtn) {
          newDocBtn.click();
          return true;
        }
        return false;
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    console.log('\n--- CAPTURING EMPTY STATE (6 images) ---');
    // Desktop >=1024 (docked)
    await capture(client, 'empty_1440.png', 1440, 900);
    const emptyAudit_1440 = await runAudit(client, 'empty', 1440, 900);

    await capture(client, 'empty_1024.png', 1024, 768);

    // Tablet 768 (closed and open)
    await setDrawerState(client, false, 768);
    await capture(client, 'empty_768_closed.png', 768, 1024);
    await setDrawerState(client, true, 768);
    await capture(client, 'empty_768_open.png', 768, 1024);

    // Mobile 375 (closed and open)
    await setDrawerState(client, false, 375);
    await capture(client, 'empty_375_closed.png', 375, 812);
    const emptyAudit_375 = await runAudit(client, 'empty', 375, 812);

    await setDrawerState(client, true, 375);
    await capture(client, 'empty_375_open.png', 375, 812);

    console.log('\n--- 3. TRIGGERING ERROR STATE VIA REAL CORRUPT PDF FIXTURE ---');
    // Find file input and upload real corrupt fixture
    const docNode = await client.send('DOM.getDocument');
    const fileInput = await client.send('DOM.querySelector', {
      nodeId: docNode.root.nodeId,
      selector: 'input[type="file"]',
    });

    console.log(`Setting file input to fixture: ${CORRUPT_PDF_PATH}`);
    await client.send('DOM.setFileInputFiles', {
      files: [CORRUPT_PDF_PATH],
      nodeId: fileInput.nodeId,
    });
    // Wait for PDF parser to catch error and render role="alert" banner
    await new Promise((r) => setTimeout(r, 3500));

    console.log('\n--- CAPTURING ERROR STATE (6 images) ---');
    // Desktop >=1024 (docked)
    await capture(client, 'error_1440.png', 1440, 900);
    const errorAudit_1440 = await runAudit(client, 'error', 1440, 900);

    await capture(client, 'error_1024.png', 1024, 768);

    // Tablet 768 (closed and open)
    await setDrawerState(client, false, 768);
    await capture(client, 'error_768_closed.png', 768, 1024);
    await setDrawerState(client, true, 768);
    await capture(client, 'error_768_open.png', 768, 1024);

    // Mobile 375 (closed and open)
    await setDrawerState(client, false, 375);
    await capture(client, 'error_375_closed.png', 375, 812);
    const errorAudit_375 = await runAudit(client, 'error', 375, 812);

    await setDrawerState(client, true, 375);
    await capture(client, 'error_375_open.png', 375, 812);

    console.log('\n--- 4. AUDIT & KEYBOARD VALIDATION ---');
    // Verify keyboard navigation on empty state dropzone & cards
    const keyboardCheck = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const dropzone = document.querySelector('[role="button"][tabindex="0"]');
        const cards = Array.from(document.querySelectorAll('[role="button"][aria-label*="Load sample"]'));
        return {
          dropzoneAccessible: !!dropzone && dropzone.getAttribute('tabindex') === '0',
          dropzoneLabel: dropzone ? dropzone.getAttribute('aria-label') : null,
          cardsCount: cards.length,
          allCardsFocusable: cards.every(c => c.getAttribute('tabindex') === '0'),
          hasAlertBanner: !!document.querySelector('[role="alert"]'),
          alertText: document.querySelector('[role="alert"]')?.textContent || null
        };
      })()`,
      returnByValue: true,
    });

    console.log('Keyboard & Dropzone Check:', keyboardCheck.result.value);

    // Verify rendered Export Button Contrast in browser (Amendment A)
    const exportContrastCheck = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Export code and chunks"]');
        if (!btn) return { error: 'Export button not found' };

        const cs = window.getComputedStyle(btn);
        const bg = cs.backgroundColor; // e.g. "rgb(79, 70, 229)"
        const color = cs.color; // e.g. "rgb(255, 255, 255)"

        function parseRgb(str) {
          const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
          return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [0, 0, 0];
        }

        function sRGBtoLin(val) {
          const c = val / 255;
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        }

        function lum(r, g, b) {
          return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
        }

        const [r1, g1, b1] = parseRgb(color);
        const [r2, g2, b2] = parseRgb(bg);
        const L1 = lum(r1, g1, b1);
        const L2 = lum(r2, g2, b2);
        const lighter = Math.max(L1, L2);
        const darker = Math.min(L1, L2);
        const ratio = (lighter + 0.05) / (darker + 0.05);

        return {
          textColor: color,
          backgroundColor: bg,
          textLuminance: L1,
          bgLuminance: L2,
          contrastRatio: parseFloat(ratio.toFixed(2)),
          satisfiesWcagAA: ratio >= 4.5,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Export Button Contrast in Browser:', exportContrastCheck.result.value);

    // Verify Overflow Menu Focus Return and Keyboard Navigation (Amendment E)
    const overflowMenuCheck = await client.send('Runtime.evaluate', {
      expression: `(async () => {
        const trigger = document.querySelector('button[aria-label="More actions"]');
        if (!trigger) return { error: 'Overflow trigger button not found' };

        // 1. Focus trigger and open
        trigger.focus();
        trigger.click();

        // Wait for React re-render
        await new Promise(r => setTimeout(r, 200));

        const menu = document.querySelector('[role="menu"]');
        if (!menu) return { error: 'Menu did not render upon click' };

        const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const firstItemFocused = document.activeElement === items[0];

        // 2. Dispatch ArrowDown
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await new Promise(r => setTimeout(r, 50));
        const secondItemFocused = items.length > 1 ? document.activeElement === items[1] : true;

        // 3. Dispatch Escape and verify menu closes and focus returns to trigger
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 200));

        const menuClosedAfterEscape = !document.querySelector('[role="menu"]');
        const focusReturnedToTrigger = document.activeElement === trigger;

        return {
          triggerFound: true,
          menuRenderedOnOpen: !!menu,
          itemsCount: items.length,
          firstItemFocusedOnOpen: firstItemFocused,
          secondItemFocusedOnArrowDown: secondItemFocused,
          menuClosedAfterEscape,
          focusReturnedToTrigger,
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('Overflow Menu Focus Return & Keyboard Check:', overflowMenuCheck.result.value);

    const fullReport = {
      timestamp: new Date().toISOString(),
      screenshotsCount: 18,
      loadedAudit_1440,
      loadedAudit_375,
      emptyAudit_1440,
      emptyAudit_375,
      errorAudit_1440,
      errorAudit_375,
      keyboardCheck: keyboardCheck.result.value,
      exportContrastCheck: exportContrastCheck.result.value,
      overflowMenuCheck: overflowMenuCheck.result.value,
    };

    fs.writeFileSync(
      path.join(OUT_DIR, 'redesign-metrics.json'),
      JSON.stringify(fullReport, null, 2)
    );
    console.log(`\nAudit saved to ${path.join(OUT_DIR, 'redesign-metrics.json')}`);

    client.close();
  } finally {
    chrome.kill();
    server.close();
  }
}

run().catch((err) => {
  console.error('[Capture Script Error]:', err);
  process.exit(1);
});
