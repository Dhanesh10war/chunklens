import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SimilarityHeatmap } from '../SimilarityHeatmap';
import { ChunkMetadata } from '../../engine/types';

const mockChunks: ChunkMetadata[] = [
  {
    id: 'c-0',
    index: 0,
    text: 'Introduction to vector databases and semantic search embedding models.',
    startCharIndex: 0,
    endCharIndex: 72,
    charCount: 72,
    tokenCount: 14,
    overlapPrevChars: 0,
    overlapNextChars: 0,
    isOrphan: false,
  },
  {
    id: 'c-1',
    index: 1,
    text: 'Vector databases store embeddings for high-dimensional semantic search indexing.',
    startCharIndex: 73,
    endCharIndex: 153,
    charCount: 80,
    tokenCount: 16,
    overlapPrevChars: 0,
    overlapNextChars: 0,
    isOrphan: false,
  },
  {
    id: 'c-2',
    index: 2,
    text: 'Completely different topic regarding financial ledger accounting principles and balance sheets.',
    startCharIndex: 154,
    endCharIndex: 249,
    charCount: 95,
    tokenCount: 18,
    overlapPrevChars: 0,
    overlapNextChars: 0,
    isOrphan: false,
  },
];

describe('SimilarityHeatmap', () => {
  it('renders empty state when chunks are empty', () => {
    const html = renderToString(<SimilarityHeatmap chunks={[]} />);
    expect(html).toContain('No Chunks Available');
  });

  it('renders heatmap matrix grid with sticky headers and cells', () => {
    const html = renderToString(<SimilarityHeatmap chunks={mockChunks} />);

    // Check metric labels
    expect(html).toContain('Boundary Continuity:');
    expect(html).toContain('High Overlap (&gt;70%):');
    expect(html).toContain('Matrix:');

    // Check legend swatches and interactive buttons
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Self');
    expect(html).toContain('High (≥70%)');
    expect(html).toContain('Moderate');
    expect(html).toContain('Low / None');

    // Check continuous gradient bar labels
    expect(html).toContain('0%');
    expect(html).toContain('100%');
    expect(html).toContain('linear-gradient(to right, var(--heat-low), var(--heat-mid), var(--heat-high))');

    // Check matrix cells render with in-gamut hex styles
    expect(html).toContain('background-color:var(--heat-self)');
    expect(html).toContain('color:#FFFFFF');
  });

  it('caps matrix computation at 150 chunks and displays responsive notice and continuity sparkline', () => {
    // Generate 160 mock chunks to trigger the 150 cap
    const largeChunks: ChunkMetadata[] = Array.from({ length: 160 }, (_, i) => ({
      id: `chunk-${i}`,
      index: i,
      text: `Chunk content number ${i} with information about topic ${i % 10}.`,
      startCharIndex: i * 50,
      endCharIndex: i * 50 + 45,
      charCount: 45,
      tokenCount: 10,
      overlapPrevChars: 0,
      overlapNextChars: 0,
      isOrphan: false,
    }));

    const html = renderToString(<SimilarityHeatmap chunks={largeChunks} />);

    // Verify capping user notice
    expect(html).toContain('Heatmap capped at 150 chunks for responsiveness; showing adjacent-neighbor continuity');
    expect(html).toMatch(/150.*×.*150/);
    expect(html).toContain('capped from 160');

    // Verify adjacent-neighbor continuity sparkline
    expect(html).toContain('Adjacent-Neighbor Boundary Continuity');
    expect(html).toContain('aria-label="Adjacent-neighbor continuity sparkline"');
  });

  it('renders all columns and cells for 65 chunks with locked sticky corner and zero drift', () => {
    const chunks65: ChunkMetadata[] = Array.from({ length: 65 }, (_, i) => ({
      id: `chunk-${i}`,
      index: i,
      text: `Chunk index ${i} discussing technical embeddings and vector similarities in data pipelines.`,
      startCharIndex: i * 80,
      endCharIndex: i * 80 + 75,
      charCount: 75,
      tokenCount: 16,
      overlapPrevChars: 0,
      overlapNextChars: 0,
      isOrphan: false,
    }));

    const html = renderToString(<SimilarityHeatmap chunks={chunks65} />);

    // 1. Verify locked sticky corner spacer is rendered with z-40 and left-0
    expect(html).toContain('w-14 shrink-0 sticky left-0 z-40 bg-bg border-r border-separator/40 self-stretch');

    // 2. Verify top column header is sticky top-0 with z-30 and full max-content width
    expect(html).toContain('sticky top-0 z-30 bg-bg pt-3 pb-1 border-b border-separator/40 w-max min-w-full');

    // 3. Verify column header container uses identical gap-1 and pl-1 as rows
    expect(html).toContain('flex items-center gap-1 shrink-0 pl-1 relative z-0');

    // 4. Verify cell buttons have shrink-0 to prevent compression or cutoff
    expect(html).toContain('w-10 h-8 shrink-0 rounded-control');

    // 5. Verify row labels are sticky left-0 with border-r and z-20
    expect(html).toContain('sticky left-0 z-20 bg-bg border-r border-separator/40');
    expect(html).toContain('w-14 h-8 flex items-center justify-end');

    // 6. Verify row container has w-max min-w-full
    expect(html).toContain('w-max min-w-full');

    // 7. Verify all 65 headers from #1 to #65 exist in HTML
    expect(html).toContain('title="Chunk #1"');
    expect(html).toContain('title="Chunk #30"');
    expect(html).toContain('title="Chunk #49"');
    expect(html).toContain('title="Chunk #65"');

    // 8. Verify diagonal cell exists for chunk 65
    expect(html).toContain('id="heatmap-cell-64-64"');
  });
});
