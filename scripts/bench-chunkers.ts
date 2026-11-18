import { SAMPLE_DOCUMENTS } from '../src/data/samples';
import { chunkFixed } from '../src/engine/chunkers/fixedChunker';
import { chunkRecursive } from '../src/engine/chunkers/recursiveChunker';
import { chunkMarkdown } from '../src/engine/chunkers/markdownChunker';
import { chunkSentence } from '../src/engine/chunkers/sentenceChunker';
import { chunkTabular } from '../src/engine/chunkers/tabularChunker';
import { ChunkingConfig, ChunkingStrategy } from '../src/engine/types';

// Build realistic 50,000-character text from sample documents
function buildRealistic50kText(sampleKey: string): string {
  const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleKey) || SAMPLE_DOCUMENTS[0];
  let text = sample.content;
  while (text.length < 50000) {
    text += '\n\n' + sample.content;
  }
  return text.slice(0, 50000);
}

const strategies: Array<{ name: ChunkingStrategy; fn: (text: string, config: ChunkingConfig) => unknown; sampleId: string }> = [
  { name: 'fixed', fn: chunkFixed, sampleId: 'api-reference' },
  { name: 'recursive', fn: chunkRecursive, sampleId: 'legal-contract' },
  { name: 'markdown', fn: chunkMarkdown, sampleId: 'academic-paper' },
  { name: 'sentence', fn: chunkSentence, sampleId: 'financial-report' },
  { name: 'tabular', fn: chunkTabular, sampleId: 'tabular-csv' },
];

const config: ChunkingConfig = {
  strategy: 'fixed',
  chunkSize: 500,
  chunkOverlap: 50,
  unit: 'characters',
  encoding: 'o200k_base',
};

console.log('================================================================');
console.log('BENCHMARK: 50,000 Characters | Unit: Characters (Main Thread DI)');
console.log('20 Runs per strategy (excluding warm-up), measuring Median & P95');
console.log('Threshold: P95 <= 50.00 ms');
console.log('================================================================\n');

interface BenchResult {
  strategy: string;
  runs: number[];
  median: number;
  p95: number;
  chunksProduced: number;
  pass: boolean;
}

const results: BenchResult[] = [];

for (const strat of strategies) {
  const text = buildRealistic50kText(strat.sampleId);
  const stratConfig = { ...config, strategy: strat.name };

  // 1 Warmup run
  strat.fn(text, stratConfig);

  const runs: number[] = [];
  let chunksCount = 0;

  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    const chunks = strat.fn(text, stratConfig) as unknown[];
    const t1 = performance.now();
    runs.push(t1 - t0);
    chunksCount = chunks.length;
  }

  runs.sort((a, b) => a - b);
  const median = runs[Math.floor(runs.length / 2)];
  // p95 for 20 runs is index 19 (or 18.05 rounded up = index 19)
  const p95 = runs[Math.min(runs.length - 1, Math.floor(runs.length * 0.95))];
  const pass = p95 <= 50.0;

  results.push({
    strategy: strat.name,
    runs,
    median,
    p95,
    chunksProduced: chunksCount,
    pass,
  });

  console.log(
    `[${strat.name.padEnd(10)}] Chunks: ${String(chunksCount).padStart(4)} | Median: ${median.toFixed(2).padStart(6)} ms | P95: ${p95.toFixed(2).padStart(6)} ms | Status: ${pass ? 'PASS (<= 50ms)' : 'FAIL (> 50ms)'}`
  );
}

console.log('\n================================================================');
const allPassed = results.every((r) => r.pass);
console.log(`OVERALL STATUS: ${allPassed ? 'ALL STRATEGIES PASS THRESHOLD' : 'SOME STRATEGIES EXCEED 50MS'}`);
console.log('================================================================');

if (!allPassed) {
  process.exit(1);
}
