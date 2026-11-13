import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MetricsBar } from '../MetricsBar';
import { ChunkingResult } from '../../engine/types';

describe('MetricsBar Component (SSR markup & count reconciliation)', () => {
  const mockResult: ChunkingResult = {
    strategy: 'recursive',
    chunks: [
      {
        id: 'c1',
        index: 0,
        text: 'Hello world',
        startCharIndex: 0,
        endCharIndex: 11,
        charCount: 11,
        tokenCount: 2,
        overlapPrevChars: 0,
        overlapNextChars: 5,
        isOrphan: false,
      },
      {
        id: 'c2',
        index: 1,
        text: 'world again',
        startCharIndex: 6,
        endCharIndex: 17,
        charCount: 11,
        tokenCount: 2,
        overlapPrevChars: 5,
        overlapNextChars: 0,
        isOrphan: false,
      },
    ],
    totalChars: 17,
    totalTokens: 3,
    totalChunkTokens: 4, // 2 + 2 = 4 (overlap token 'world' counted twice)
    avgTokensPerChunk: 2,
    minTokensPerChunk: 2,
    maxTokensPerChunk: 2,
    estimatedCostUsd: 0.00000008,
    executionTimeMs: 1.25,
  };

  it('renders Ingested tokens and Document tokens with explanatory labels', () => {
    const html = renderToString(<MetricsBar result={mockResult} />);

    // Ingested tokens (includes overlap)
    expect(html).toContain('Ingested');
    expect(html).toContain('data-testid="ingested-tokens"');
    expect(html).toContain('tok');

    // Document tokens (raw document, no overlap)
    expect(html).toContain('data-testid="document-tokens"');
    expect(html).toContain('doc');

    // Character count
    expect(html).toContain('data-testid="document-chars"');
    expect(html).toContain('ch');

    // Numbers present in rendered markup
    expect(html).toContain('4<!-- --> tok');
    expect(html).toContain('3<!-- --> doc');
    expect(html).toContain('17<!-- --> ch');
  });

  it('renders chunk count, average, and compute latency', () => {
    const html = renderToString(<MetricsBar result={mockResult} />);
    expect(html).toContain('Chunks');
    expect(html).toContain('Avg/Chunk');
    expect(html).toContain('Compute');
    expect(html).toContain('1.25<!-- --> ms');
  });

  it('renders wrapped two-row layout for mobile viewports below 768px (Amendment C)', () => {
    const html = renderToString(<MetricsBar result={mockResult} />);
    expect(html).toContain('md:hidden');
    expect(html).toContain('data-testid="mobile-metric-tokens"');
    expect(html).toContain('Cost');
  });
});
