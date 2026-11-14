const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '../dist/assets');

if (!fs.existsSync(ASSETS_DIR)) {
  console.error('[Bundle Check ERROR] dist/assets directory not found. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
const jsMainFile = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
const cssMainFile = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));

if (!jsMainFile) {
  console.error('[Bundle Check ERROR] Main JavaScript bundle (index-*.js) not found in dist/assets.');
  process.exit(1);
}

if (!cssMainFile) {
  console.error('[Bundle Check ERROR] Main CSS bundle (index-*.css) not found in dist/assets.');
  process.exit(1);
}

const jsPath = path.join(ASSETS_DIR, jsMainFile);
const cssPath = path.join(ASSETS_DIR, cssMainFile);

const jsSizeBytes = fs.statSync(jsPath).size;
const jsSizeKb = parseFloat((jsSizeBytes / 1024).toFixed(2));
const cssSizeBytes = fs.statSync(cssPath).size;
const cssSizeKb = parseFloat((cssSizeBytes / 1024).toFixed(2));

const JS_LIMIT_KB = 185.0;
const CSS_LIMIT_KB = 45.0;

let hasError = false;

console.log('--- ChunkLens Production Bundle Budget Gate ---');
console.log(`JavaScript (${jsMainFile}): ${jsSizeKb} kB (Budget: <= ${JS_LIMIT_KB} kB)`);
if (jsSizeKb > JS_LIMIT_KB) {
  console.error(`[BUDGET BREACH] JavaScript bundle exceeds ${JS_LIMIT_KB} kB limit by ${(jsSizeKb - JS_LIMIT_KB).toFixed(2)} kB.`);
  hasError = true;
} else {
  console.log(`[PASS] JavaScript bundle is ${(JS_LIMIT_KB - jsSizeKb).toFixed(2)} kB under budget.`);
}

console.log(`CSS (${cssMainFile}): ${cssSizeKb} kB (Budget: <= ${CSS_LIMIT_KB} kB)`);
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
