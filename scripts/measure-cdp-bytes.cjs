const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = process.env.PW_CHROME_PATH || undefined;
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}`;

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
        for (const handler of eventListeners.get(msg.method)) {
          handler(msg.params);
        }
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
    if (!eventListeners.has(method)) {
      eventListeners.set(method, []);
    }
    eventListeners.get(method).push(handler);
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

async function runMeasurements() {
  console.log('[CDP Measure] Building application...');
  const { execSync } = require('child_process');
  execSync('npm run build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });

  console.log('[CDP Measure] Starting Vite preview server...');
  const previewProc = spawn('npm', ['run', 'preview', '--', '--port', String(PREVIEW_PORT)], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  // Wait for preview server
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
    throw new Error('Vite preview server failed to start');
  }

  const chromePort = 9346;
  const userDataDir = '/tmp/cdp-measure-profile-' + Date.now();
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-extensions',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const targets = await fetchJson(`http://127.0.0.1:${chromePort}/json`);
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = await createCdpClient(pageTarget.webSocketDebuggerUrl);

    // Track network requests
    let currentPhase = '';
    const phaseRecords = {
      first_learn_load: [],
      lesson_3_2_load: [],
      v2_char_interaction: [],
      v2_token_interaction: [],
    };

    const requestMap = new Map();

    client.on('Network.requestWillBeSent', (params) => {
      requestMap.set(params.requestId, {
        url: params.request.url,
        phase: currentPhase,
      });
    });

    client.on('Network.responseReceived', (params) => {
      const entry = requestMap.get(params.requestId);
      if (entry) {
        entry.mimeType = params.response.mimeType;
        entry.status = params.response.status;
        entry.headers = params.response.headers;
      }
    });

    client.on('Network.loadingFinished', (params) => {
      const entry = requestMap.get(params.requestId);
      if (entry && entry.phase && phaseRecords[entry.phase]) {
        entry.encodedDataLength = params.encodedDataLength; // bytes on wire (compressed)
        entry.rawLength = parseInt(entry.headers?.['content-length'] || '0', 10) || params.encodedDataLength;
        phaseRecords[entry.phase].push({ ...entry });
      }
    });

    await client.send('Network.enable');
    await client.send('Page.enable');
    await client.send('Network.clearBrowserCache');

    // -----------------------------------------------------------------------
    // PHASE 1: First ?view=learn Load (Cold)
    // -----------------------------------------------------------------------
    console.log('[CDP Measure] Phase 1: Measuring First ?view=learn Load (Cold)...');
    currentPhase = 'first_learn_load';
    await client.send('Page.navigate', { url: `${PREVIEW_URL}/?view=learn` });
    await new Promise((r) => setTimeout(r, 3000));

    // -----------------------------------------------------------------------
    // PHASE 2: Navigate to Lesson 3.2 (Loads V2 Sandbox chunk)
    // -----------------------------------------------------------------------
    console.log('[CDP Measure] Phase 2: Measuring Lesson 3.2 + V2 Chunk Load...');
    currentPhase = 'lesson_3_2_load';
    await client.send('Page.navigate', { url: `${PREVIEW_URL}/?view=learn&lesson=3-2-the-size-trade-off` });
    await new Promise((r) => setTimeout(r, 2500));

    // -----------------------------------------------------------------------
    // PHASE 3: First V2 Interaction in Character Mode
    // -----------------------------------------------------------------------
    console.log('[CDP Measure] Phase 3: Measuring First V2 Interaction in Character Mode...');
    currentPhase = 'v2_char_interaction';
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const ta = document.getElementById('v2-sandbox-input');
        if (ta) {
          ta.value = 'A'.repeat(5000);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000)); // wait for 200ms debounce

    // -----------------------------------------------------------------------
    // PHASE 4: First V2 Interaction in Token Mode
    // -----------------------------------------------------------------------
    console.log('[CDP Measure] Phase 4: Measuring Token Mode Interaction...');
    currentPhase = 'v2_token_interaction';
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        // Find token mode button
        const buttons = Array.from(document.querySelectorAll('button'));
        const tokenBtn = buttons.find(b => b.textContent && b.textContent.includes('Tokens (Exact)'));
        if (tokenBtn) tokenBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Accept warning dialog if opened
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Load Tokenizer'));
        if (confirmBtn) confirmBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    client.close();

    // -----------------------------------------------------------------------
    // COMPUTE METRICS
    // -----------------------------------------------------------------------
    const computeStats = (records) => {
      let totalEncoded = 0;
      let totalRaw = 0;
      const assets = [];
      for (const r of records) {
        totalEncoded += r.encodedDataLength || 0;
        totalRaw += r.rawLength || r.encodedDataLength || 0;
        const filename = path.basename(r.url.split('?')[0]);
        assets.push({
          url: r.url,
          filename: filename || '/',
          encoded: r.encodedDataLength || 0,
          raw: r.rawLength || r.encodedDataLength || 0,
          status: r.status,
        });
      }
      return { totalEncoded, totalRaw, assets };
    };

    const p1 = computeStats(phaseRecords.first_learn_load);
    const p2 = computeStats(phaseRecords.lesson_3_2_load);
    const p3 = computeStats(phaseRecords.v2_char_interaction);
    const p4 = computeStats(phaseRecords.v2_token_interaction);

    const hasTiktokenInP1 = p1.assets.some(a => a.filename.includes('tiktoken'));
    const hasPdfInP1 = p1.assets.some(a => a.filename.includes('pdf'));
    const hasWorkerInP1 = p1.assets.some(a => a.filename.includes('worker'));

    const hasTiktokenInP2 = p2.assets.some(a => a.filename.includes('tiktoken'));
    const hasTiktokenInP3 = p3.assets.some(a => a.filename.includes('tiktoken'));

    const results = {
      first_learn_load: {
        rawBytes: p1.totalRaw,
        compressedBytes: p1.totalEncoded,
        rawKb: (p1.totalRaw / 1000).toFixed(2),
        compressedKb: (p1.totalEncoded / 1000).toFixed(2),
        tiktokenLoaded: hasTiktokenInP1,
        pdfLoaded: hasPdfInP1,
        workerLoaded: hasWorkerInP1,
        assets: p1.assets,
      },
      lesson_3_2_load: {
        rawBytes: p2.totalRaw,
        compressedBytes: p2.totalEncoded,
        rawKb: (p2.totalRaw / 1000).toFixed(2),
        compressedKb: (p2.totalEncoded / 1000).toFixed(2),
        tiktokenLoaded: hasTiktokenInP2,
        assets: p2.assets,
      },
      v2_char_interaction: {
        rawBytes: p3.totalRaw,
        compressedBytes: p3.totalEncoded,
        rawKb: (p3.totalRaw / 1000).toFixed(2),
        compressedKb: (p3.totalEncoded / 1000).toFixed(2),
        tiktokenLoaded: hasTiktokenInP3,
        assets: p3.assets,
      },
      v2_token_interaction: {
        rawBytes: p4.totalRaw,
        compressedBytes: p4.totalEncoded,
        rawKb: (p4.totalRaw / 1000).toFixed(2),
        compressedKb: (p4.totalEncoded / 1000).toFixed(2),
        assets: p4.assets,
      },
    };

    console.log('\n======================================================');
    console.log('       CHUNKLENS LEARN TRACK CDP MEASUREMENTS         ');
    console.log('======================================================\n');
    console.log(`1. First ?view=learn Load:`);
    console.log(`   Transferred (wire): ${results.first_learn_load.compressedKb} kB (${results.first_learn_load.compressedBytes} bytes)`);
    console.log(`   Uncompressed (raw): ${results.first_learn_load.rawKb} kB (${results.first_learn_load.rawBytes} bytes)`);
    console.log(`   tiktoken loaded:    ${results.first_learn_load.tiktokenLoaded ? 'FAIL (YES)' : 'PASS (NO)'}`);
    console.log(`   pdf engine loaded:  ${results.first_learn_load.pdfLoaded ? 'FAIL (YES)' : 'PASS (NO)'}`);
    console.log(`   worker loaded:      ${results.first_learn_load.workerLoaded ? 'FAIL (YES)' : 'PASS (NO)'}`);

    console.log(`\n2. Lesson 3.2 Load (with V2 sandbox chunk):`);
    console.log(`   Transferred (wire): ${results.lesson_3_2_load.compressedKb} kB (${results.lesson_3_2_load.compressedBytes} bytes)`);
    console.log(`   tiktoken loaded:    ${results.lesson_3_2_load.tiktokenLoaded ? 'FAIL (YES)' : 'PASS (NO)'}`);

    console.log(`\n3. First V2 Interaction in Character Mode:`);
    console.log(`   Transferred (wire): ${results.v2_char_interaction.compressedKb} kB (${results.v2_char_interaction.compressedBytes} bytes)`);
    console.log(`   Network egress:     ${results.v2_char_interaction.compressedBytes === 0 ? 'PASS (0 bytes)' : 'FAIL'}`);

    console.log(`\n4. Token Mode Activation:`);
    console.log(`   Transferred (wire): ${results.v2_token_interaction.compressedKb} kB (${results.v2_token_interaction.compressedBytes} bytes)`);

    // Write output to docs/design/learn/cdp-measurements.json
    const outDir = path.resolve(__dirname, '../docs/design/learn');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'cdp-measurements.json'), JSON.stringify(results, null, 2));
    console.log(`\n[CDP Measure] Saved detailed audit to docs/design/learn/cdp-measurements.json`);

    process.exit(0);
  } finally {
    chromeProc.kill();
    previewProc.kill();
  }
}

runMeasurements().catch((e) => {
  console.error('[CDP Measure Error]:', e);
  process.exit(1);
});
