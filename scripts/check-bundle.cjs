const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '../dist/assets');

if (!fs.existsSync(ASSETS_DIR)) {
  console.error('[Bundle Check ERROR] dist/assets directory not found. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
const jsMainFile = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
const jsWorkbenchFile = files.find((f) => f.startsWith('WorkbenchView-') && f.endsWith('.js'));
const cssMainFile = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));

if (!jsMainFile) {
  console.error('[Bundle Check ERROR] Main JavaScript bundle (index-*.js) not found in dist/assets.');
  process.exit(1);
}

if (!jsWorkbenchFile) {
  console.error('[Bundle Check ERROR] WorkbenchView JavaScript bundle (WorkbenchView-*.js) not found in dist/assets.');
  process.exit(1);
}

if (!cssMainFile) {
  console.error('[Bundle Check ERROR] Main CSS bundle (index-*.css) not found in dist/assets.');
  process.exit(1);
}

const jsPath = path.join(ASSETS_DIR, jsMainFile);
const workbenchPath = path.join(ASSETS_DIR, jsWorkbenchFile);
const cssPath = path.join(ASSETS_DIR, cssMainFile);

const jsSizeBytes = fs.statSync(jsPath).size;
const jsSizeKb = parseFloat((jsSizeBytes / 1000).toFixed(2));
const jsSizeKib = parseFloat((jsSizeBytes / 1024).toFixed(2));

const workbenchSizeBytes = fs.statSync(workbenchPath).size;
const workbenchSizeKb = parseFloat((workbenchSizeBytes / 1000).toFixed(2));
const workbenchSizeKib = parseFloat((workbenchSizeBytes / 1024).toFixed(2));

const totalAppJsKb = parseFloat((jsSizeKb + workbenchSizeKb).toFixed(2));

const cssSizeBytes = fs.statSync(cssPath).size;
const cssSizeKb = parseFloat((cssSizeBytes / 1000).toFixed(2));
const cssSizeKib = parseFloat((cssSizeBytes / 1024).toFixed(2));

const JS_MAIN_LIMIT_KB = 185.0;     // Decimal kB standard matching Vite output
const WORKBENCH_LIMIT_KB = 120.0;   // Decimal kB standard for lazy WorkbenchView
const TOTAL_APP_JS_LIMIT_KB = 165.0;// Total JS for ?view=app (Main + Workbench)
const CSS_LIMIT_KB = 45.0;          // Decimal kB standard matching Vite output

let hasError = false;

console.log('--- ChunkLens Production Bundle Budget Gate ---');
console.log('Metric Standard: Decimal kB (1 kB = 1,000 bytes) matching Vite build output [binary KiB in brackets]');

// 1. Main Shell JS
console.log(`Main Shell JS (${jsMainFile}): ${jsSizeKb} kB [${jsSizeKib} KiB] (Budget: <= ${JS_MAIN_LIMIT_KB} kB)`);
if (jsSizeKb > JS_MAIN_LIMIT_KB) {
  console.error(`[BUDGET BREACH] Main JS bundle exceeds ${JS_MAIN_LIMIT_KB} kB limit by ${(jsSizeKb - JS_MAIN_LIMIT_KB).toFixed(2)} kB.`);
  hasError = true;
} else {
  console.log(`[PASS] Main JS bundle is ${(JS_MAIN_LIMIT_KB - jsSizeKb).toFixed(2)} kB under budget.`);
}

// 2. WorkbenchView Chunk JS
console.log(`WorkbenchView Chunk (${jsWorkbenchFile}): ${workbenchSizeKb} kB [${workbenchSizeKib} KiB] (Budget: <= ${WORKBENCH_LIMIT_KB} kB)`);
if (workbenchSizeKb > WORKBENCH_LIMIT_KB) {
  console.error(`[BUDGET BREACH] WorkbenchView chunk exceeds ${WORKBENCH_LIMIT_KB} kB limit by ${(workbenchSizeKb - WORKBENCH_LIMIT_KB).toFixed(2)} kB.`);
  hasError = true;
} else {
  console.log(`[PASS] WorkbenchView chunk is ${(WORKBENCH_LIMIT_KB - workbenchSizeKb).toFixed(2)} kB under budget.`);
}

// 3. Total Initial JS for ?view=app
console.log(`Total Initial JS for ?view=app (Main + Workbench): ${totalAppJsKb} kB (Budget: <= ${TOTAL_APP_JS_LIMIT_KB} kB)`);
console.log(`Note: v0.3 main chunk was 136.00 kB (monolithic). P0 is ${totalAppJsKb} kB (${jsSizeKb} kB main + ${workbenchSizeKb} kB workbench).`);
if (totalAppJsKb > TOTAL_APP_JS_LIMIT_KB) {
  console.error(`[BUDGET BREACH] Total ?view=app JS exceeds ${TOTAL_APP_JS_LIMIT_KB} kB limit by ${(totalAppJsKb - TOTAL_APP_JS_LIMIT_KB).toFixed(2)} kB.`);
  hasError = true;
} else {
  console.log(`[PASS] Total ?view=app JS is ${(TOTAL_APP_JS_LIMIT_KB - totalAppJsKb).toFixed(2)} kB under budget.`);
}

// 4. Main CSS
console.log(`CSS (${cssMainFile}): ${cssSizeKb} kB [${cssSizeKib} KiB] (Budget: <= ${CSS_LIMIT_KB} kB)`);
if (cssSizeKb > CSS_LIMIT_KB) {
  console.error(`[BUDGET BREACH] CSS bundle exceeds ${CSS_LIMIT_KB} kB limit by ${(cssSizeKb - CSS_LIMIT_KB).toFixed(2)} kB.`);
  hasError = true;
} else {
  console.log(`[PASS] CSS bundle is ${(CSS_LIMIT_KB - cssSizeKb).toFixed(2)} kB under budget.`);
}

if (hasError) {
  process.exit(1);
}

console.log('[Bundle Check PASS] All bundle size budgets satisfied.');
process.exit(0);
