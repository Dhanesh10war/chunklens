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
});
