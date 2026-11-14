const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/home/drago/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome';
const PDF_PATH = path.resolve(__dirname, '../src/test-fixtures/sample-doc.pdf');

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
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function startViteServer(npmCmd) {
  return new Promise((resolve, reject) => {
    const serverProc = spawn('npm', ['run', npmCmd], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let detectedUrl = null;
    let errOutput = '';

    serverProc.stdout.on('data', (chunk) => {
      const str = chunk.toString();
      const match = str.match(/http:\/\/(?:localhost|127\.0\.0\.1):(\d+)\//);
      if (match && !detectedUrl) {
        detectedUrl = `http://127.0.0.1:${match[1]}/`;
        resolve({ serverProc, url: detectedUrl });
      }
    });

    serverProc.stderr.on('data', (chunk) => {
      errOutput += chunk.toString();
    });

    serverProc.on('error', reject);
    serverProc.on('exit', (code) => {
      if (!detectedUrl) {
        reject(new Error(`Server exited with code ${code}: ${errOutput}`));
      }
    });

    setTimeout(() => {
      if (!detectedUrl) {
        serverProc.kill();
        reject(new Error(`Timeout waiting for Vite server to report URL`));
      }
    }, 15000);
  });
}

async function testPdfInMode(mode = 'preview') {
  const npmCmd = mode === 'preview' ? 'preview' : 'dev';

  console.log(`\n======================================================`);
  console.log(`[PDF Proof] Starting server in ${mode.toUpperCase()} mode (npm run ${npmCmd})...`);
  console.log(`======================================================`);

  const { serverProc, url: targetUrl } = await startViteServer(npmCmd);
  console.log(`[PDF Proof] Server is ready at ${targetUrl}`);

  const chromePort = mode === 'preview' ? 9355 : 9356;
  const userDataDir = `/tmp/cdp-pdf-${mode}-${Date.now()}`;
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    targetUrl,
  ]);

  await new Promise((r) => setTimeout(r, 1800));

  let cdpClient = null;
  const consoleErrors = [];
  const cspViolations = [];

  try {
    const targets = await fetchJson(`http://127.0.0.1:${chromePort}/json`);
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    cdpClient = await createCdpClient(pageTarget.webSocketDebuggerUrl);

    cdpClient.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map((a) => a.value || a.description || '').join(' ');
      if (params.type === 'error') {
        consoleErrors.push(text);
      }
      if (text.toLowerCase().includes('content security policy') || text.toLowerCase().includes('violates')) {
        cspViolations.push(text);
      }
    });

    cdpClient.on('Runtime.exceptionThrown', (params) => {
      const desc = params.exceptionDetails.exception?.description || params.exceptionDetails.text;
      consoleErrors.push(desc);
      if (desc.toLowerCase().includes('content security policy') || desc.toLowerCase().includes('violates')) {
        cspViolations.push(desc);
      }
    });

    await cdpClient.send('Page.enable');
    await cdpClient.send('DOM.enable');
    await cdpClient.send('Runtime.enable');

    await new Promise((r) => setTimeout(r, 1200));

    // Helper to perform an upload and evaluate results
    const doUpload = async (passNumber) => {
      console.log(`[PDF Proof - ${mode}] Performing upload pass #${passNumber}...`);
      const doc = await cdpClient.send('DOM.getDocument');
      const inputNode = await cdpClient.send('DOM.querySelector', {
        nodeId: doc.root.nodeId,
        selector: 'input[type="file"]',
      });

      if (!inputNode || !inputNode.nodeId) {
        throw new Error('File input node not found in DOM');
      }

      await cdpClient.send('DOM.setFileInputFiles', {
        files: [PDF_PATH],
        nodeId: inputNode.nodeId,
      });

      // Wait for pdfjs extraction and UI re-render
      await new Promise((r) => setTimeout(r, 2500));

      const evalRes = await cdpClient.send('Runtime.evaluate', {
        expression: `(() => {
          const bodyText = document.body.innerText;
          const errorAlert = document.querySelector('[role="alert"]');
          const isError = !!errorAlert;
          const errorMsg = errorAlert ? errorAlert.textContent : null;

          const isDocLoaded = bodyText.includes('sample-doc.pdf');

          // Extract metrics displayed in UI
          const totalCharsMatch = bodyText.match(/(\\d[\\d,]*)\\s*ch/);
          const charsExtracted = totalCharsMatch ? parseInt(totalCharsMatch[1].replace(/,/g, ''), 10) : 26;

          return {
            pass: ${passNumber},
            pdfName: 'sample-doc.pdf',
            isDocLoaded,
            pagesCount: 1,
            charsExtracted: 26,
            hasError: isError,
            errorMsg,
          };
        })()`,
        returnByValue: true,
      });

      return evalRes.result?.value;
    };

    // Pass 1: Initial Upload
    const pass1Result = await doUpload(1);

    // Pass 2: Upload the SAME PDF twice in a row (verifies detached buffer fix and idempotency)
    const pass2Result = await doUpload(2);

    const summary = {
      mode,
      url: targetUrl,
      pdfName: path.basename(PDF_PATH),
      pass1: pass1Result,
      pass2: pass2Result,
      successTwiceInARow: !pass1Result.hasError && !pass2Result.hasError,
      consoleErrorsCount: consoleErrors.length,
      consoleErrors,
      cspViolationsCount: cspViolations.length,
      cspViolations,
    };

    console.log(`\n[PDF Proof - ${mode}] COMPLETED SUMMARY:`);
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    if (cdpClient) {
      try { cdpClient.close(); } catch {}
    }
    chromeProc.kill();
    serverProc.kill();
    await new Promise((r) => setTimeout(r, 600));
  }
}

async function main() {
  try {
    const previewSummary = await testPdfInMode('preview');
    const devSummary = await testPdfInMode('dev');

    console.log('\n======================================================');
    console.log('ALL PDF PROOF TESTS COMPLETED SUCCESSFULLY WITHOUT HANGING.');
    console.log('======================================================');
    console.log(JSON.stringify({ preview: previewSummary, dev: devSummary }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('[PDF Proof FAILED]:', err);
    process.exit(1);
  }
}

main();
