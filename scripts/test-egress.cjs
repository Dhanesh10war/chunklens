const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const CHROME_PATH = '/home/drago/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome';
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}/`;

function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();
  const eventListeners = new Map();

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(new Error(msg.error.message));
      else cb.resolve(msg.result);
    } else if (msg.method) {
      if (eventListeners.has(msg.method)) {
        eventListeners.get(msg.method)(msg.params);
      }
    }
  });

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  const on = (method, handler) => {
    eventListeners.set(method, handler);
  };

  return new Promise((resolve) => {
    ws.addEventListener('open', () => resolve({ send, on, close: () => ws.close() }));
  });
}

function fetchJson(url) {
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

async function runEgressTest() {
  console.log('[Egress Test] Starting Vite preview server on port ' + PREVIEW_PORT + '...');
  const previewProc = spawn('npm', ['run', 'preview'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  // Wait for preview server to be responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(PREVIEW_URL, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error('status ' + res.statusCode));
        }).on('error', reject);
      });
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  if (!ready) {
    previewProc.kill();
    throw new Error('Vite preview server failed to start on port ' + PREVIEW_PORT);
  }
  console.log('[Egress Test] Vite preview server is up at ' + PREVIEW_URL);

  const chromePort = 9345;
  const userDataDir = '/tmp/cdp-egress-profile-' + Date.now();
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-extensions',
    PREVIEW_URL,
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const targets = await fetchJson(`http://127.0.0.1:${chromePort}/json`);
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = await createCdpClient(pageTarget.webSocketDebuggerUrl);

    const recordedRequests = [];
    const crossOriginRequests = [];

    client.on('Network.requestWillBeSent', (params) => {
      const url = params.request.url;
      recordedRequests.push(url);
      const isAllowed =
        url.startsWith(`http://127.0.0.1:${PREVIEW_PORT}`) ||
        url.startsWith('data:') ||
        url.startsWith('blob:');

      if (!isAllowed) {
        crossOriginRequests.push(url);
      }
    });

    await client.send('Network.enable');
    await client.send('Page.enable');
    await client.send('DOM.enable');

    console.log('[Egress Test] Reloading page to capture all initial network requests...');
    await client.send('Page.reload');
    await new Promise((r) => setTimeout(r, 2500));

    // Verify CSP meta tag exists in DOM
    const evalResult = await client.send('Runtime.evaluate', {
      expression: 'document.querySelector("meta[http-equiv=\'Content-Security-Policy\']")?.getAttribute("content") || ""',
    });
    const cspContent = evalResult.result?.value || '';

    // Verify self-hosted font loading
    const fontFacesResult = await client.send('Runtime.evaluate', {
      expression: 'Array.from(document.fonts).map(f => ({ family: f.family, status: f.status }))',
      returnByValue: true,
    });
    const fontsLoaded = fontFacesResult.result?.value || [];

    console.log('[Egress Test] Total recorded requests count:', recordedRequests.length);
    console.log('[Egress Test] Sample requests:\n ', recordedRequests.slice(0, 10).join('\n  '));
    console.log('[Egress Test] CSP header content:', cspContent);
    console.log('[Egress Test] Loaded fonts in document:', fontsLoaded);

    let failed = false;

    if (!cspContent.includes("connect-src 'none'")) {
      console.error('[Egress Test FAIL] Missing connect-src \'none\' in CSP meta tag');
      failed = true;
    }

    if (!cspContent.includes("font-src 'self'")) {
      console.error('[Egress Test FAIL] Missing font-src \'self\' in CSP meta tag');
      failed = true;
    }

    if (crossOriginRequests.length > 0) {
      console.error('[Egress Test FAIL] Detected cross-origin egress requests:', crossOriginRequests);
      failed = true;
    }

    const hasGoogleFonts = recordedRequests.some((u) =>
      u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')
    );
    if (hasGoogleFonts) {
      console.error('[Egress Test FAIL] Detected Google Fonts request in recorded network calls!');
      failed = true;
    }

    if (failed) {
      console.error('[Egress Test] FAILED: Cross-origin network egress or invalid CSP detected.');
      process.exit(1);
    } else {
      console.log('[Egress Test PASS] Proof verified: Zero cross-origin network egress. Strict CSP active.');
      process.exit(0);
    }

    client.close();
  } finally {
    chromeProc.kill();
    previewProc.kill();
  }
}

runEgressTest().catch((err) => {
  console.error('[Egress Test Error]:', err);
  process.exit(1);
});
