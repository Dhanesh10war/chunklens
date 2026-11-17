import { describe, it, expect } from 'vitest';
import { chunkFixed } from '../fixedChunker';
import { chunkRecursive } from '../recursiveChunker';
import { chunkMarkdown } from '../markdownChunker';
import { chunkSentence } from '../sentenceChunker';
import { chunkTabular } from '../tabularChunker';
import { ChunkingConfig, ChunkMetadata } from '../../types';

function runChunker(strategy: string, text: string, config: ChunkingConfig): ChunkMetadata[] {
  switch (strategy) {
    case 'fixed':
      return chunkFixed(text, config);
    case 'recursive':
      return chunkRecursive(text, config);
    case 'markdown':
      return chunkMarkdown(text, config);
    case 'sentence':
      return chunkSentence(text, config);
    case 'tabular':
      return chunkTabular(text, config);
    default:
      throw new Error(`Unsupported strategy: ${strategy}`);
  }
}

describe('Chunker Property-Style Invariants (F4 Hardening)', () => {
  const corpusGenerators: Array<{ name: string; generate: () => string; suitableStrategies: string[] }> = [
    {
      name: 'Markdown with headings, lists, code fences & extra newlines',
      generate: () => `# Introduction to Systems
This is a comprehensive overview of distributed stream architectures.
Dr. Smith and Prof. Davis noted that e.g. latency must stay under 50ms.

## Code Section
\`\`\`typescript
const a = 1;
const b = 2;
const c = 3;
\`\`\`

### Bullet Points
- Feature 1: Highly reliable
- Feature 2: Zero data leakage
- Feature 3: Low latency

Conclusion paragraph with more details.\n\n\n\nFinal remark.`,
      suitableStrategies: ['fixed', 'recursive', 'markdown', 'sentence'],
    },
    {
      name: 'Tabular CSV with identical duplicate rows & mixed delimiters',
      generate: () => `id,name,role,status
101,Alice,Engineer,Active
102,Bob,Manager,Active
102,Bob,Manager,Active
102,Bob,Manager,Active
103,Charlie,Designer,Pending
104,Dana,DevOps,Active
104,Dana,DevOps,Active`,
      suitableStrategies: ['fixed', 'recursive', 'tabular'],
    },
    {
      name: 'Complex sentences with legal double-spaces, tabs, abbreviations',
      generate: () => `First sentence states terms.   Second sentence follows with three spaces.\tThird sentence has tabs.\nFourth sentence cites e.g. section 4.2 vs. section 5.1 of the agreement.   Fifth sentence concludes cleanly.`,
      suitableStrategies: ['fixed', 'recursive', 'sentence'],
    },
    {
      name: 'Repetitive sequences and boundary stress cases',
      generate: () => `alpha alpha alpha alpha alpha beta beta beta beta beta gamma gamma gamma gamma delta delta delta`,
      suitableStrategies: ['fixed', 'recursive', 'sentence'],
    },
    {
      name: 'Multilingual and Unicode content (CJK, emoji)',
      generate: () => `人工智能正在改变世界。🚀 This system processes bilingual streams smoothly! 日本語のテスト文章も含まれています。`,
      suitableStrategies: ['fixed', 'recursive', 'sentence'],
    },
  ];

  const configVariations: Array<{ chunkSize: number; chunkOverlap: number; unit: 'characters' | 'tokens' }> = [
    { chunkSize: 40, chunkOverlap: 10, unit: 'characters' },
    { chunkSize: 80, chunkOverlap: 20, unit: 'characters' },
    { chunkSize: 30, chunkOverlap: 0, unit: 'characters' },
    { chunkSize: 50, chunkOverlap: 50, unit: 'characters' }, // Overlap >= size boundary condition
    { chunkSize: 20, chunkOverlap: 5, unit: 'tokens' },
    { chunkSize: 40, chunkOverlap: 10, unit: 'tokens' },
  ];

  const allStrategies = ['fixed', 'recursive', 'markdown', 'sentence', 'tabular'];

  for (const strategy of allStrategies) {
    describe(`Strategy: ${strategy}`, () => {
      for (const corpus of corpusGenerators) {
        if (!corpus.suitableStrategies.includes(strategy)) continue;

        for (const cfg of configVariations) {
          it(`[${corpus.name}] sz=${cfg.chunkSize} ov=${cfg.chunkOverlap} unit=${cfg.unit}`, () => {
            const text = corpus.generate();
            const config: ChunkingConfig = {
              strategy: strategy as any,
              chunkSize: cfg.chunkSize,
              chunkOverlap: cfg.chunkOverlap,
              unit: cfg.unit,
              encoding: 'o200k_base',
            };

            const chunks1 = runChunker(strategy, text, config);
            const chunks2 = runChunker(strategy, text, config);

            // Property (e): Deterministic output for same input
            expect(chunks1).toEqual(chunks2);

            expect(chunks1.length).toBeGreaterThan(0);

            let totalChunkChars = 0;

            for (const chunk of chunks1) {
              // Property (b): No -1 offsets
              expect(chunk.startCharIndex).toBeGreaterThanOrEqual(0);
              expect(chunk.endCharIndex).toBeGreaterThanOrEqual(chunk.startCharIndex);

              // Property (c): No empty chunks
              expect(chunk.text.length).toBeGreaterThan(0);
              expect(chunk.charCount).toBe(chunk.text.length);

              // Property (a): Slice matches source exactly
              if (strategy === 'tabular') {
                // In tabular chunker, schema header line is prepended by design for RAG retrieval
                // Verify the data rows portion matches source slice
                const sourceSlice = text.slice(chunk.startCharIndex, chunk.endCharIndex);
                expect(sourceSlice.length).toBeGreaterThan(0);
                expect(chunk.text).toContain(sourceSlice.split('\n')[0]);
              } else {
                const sourceSlice = text.slice(chunk.startCharIndex, chunk.endCharIndex);
                expect(sourceSlice).toBe(chunk.text);
              }

              totalChunkChars += chunk.charCount;
            }

            // Property (d): When chunks overlap, sum of chunk lengths exceeds or matches unique covered characters
            const actualOverlap = chunks1.slice(1).reduce((sum, c) => sum + c.overlapPrevChars, 0);
            if (actualOverlap > 0 && chunks1.length > 1) {
              const uniqueIndices = new Set<number>();
              for (const c of chunks1) {
                for (let i = c.startCharIndex; i < c.endCharIndex; i++) {
                  uniqueIndices.add(i);
                }
              }
              expect(totalChunkChars).toBeGreaterThan(uniqueIndices.size);
            }
          });
        }
      }
    });
  }
});
