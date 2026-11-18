import { describe, it, expect } from 'vitest';
import { SAMPLE_DOCUMENTS } from '../../../data/samples';
import { executeChunking } from '../index';
import { ChunkingConfig, ChunkingStrategy, ChunkUnit } from '../../types';

describe('B1 Golden Characterization Test Suite (6 Docs x 5 Strategies x 2 Units x 2 Settings = 120 Configurations)', () => {
  const STRATEGIES: ChunkingStrategy[] = ['fixed', 'recursive', 'markdown', 'sentence', 'tabular'];
  const UNITS: ChunkUnit[] = ['characters', 'tokens'];
  const SETTINGS = [
    { chunkSize: 400, chunkOverlap: 40 },
    { chunkSize: 800, chunkOverlap: 80 },
  ];

  for (const sample of SAMPLE_DOCUMENTS) {
    describe(`Document: ${sample.id}`, () => {
      for (const strategy of STRATEGIES) {
        for (const unit of UNITS) {
          for (const setting of SETTINGS) {
            it(`${strategy} | ${unit} | sz=${setting.chunkSize} ov=${setting.chunkOverlap}`, () => {
              const config: ChunkingConfig = {
                strategy,
                chunkSize: setting.chunkSize,
                chunkOverlap: setting.chunkOverlap,
                unit,
                encoding: 'o200k_base',
                separators: ['\n\n', '\n', ' ', ''],
              };

              const result = executeChunking(sample.content, config);

              const snapshot = result.chunks.map((c) => ({
                index: c.index,
                text: c.text,
                startCharIndex: c.startCharIndex,
                endCharIndex: c.endCharIndex,
                tokenCount: c.tokenCount,
              }));

              expect(snapshot).toMatchSnapshot();
            });
          }
        }
      }
    });
  }
});
