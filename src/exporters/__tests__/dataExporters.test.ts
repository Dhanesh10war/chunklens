import { describe, it, expect } from 'vitest';
import { exportChunksToJson, exportChunksToCsv } from '../dataExporters';
import { ChunkMetadata, ChunkingConfig } from '../../engine/types';

describe('Dataset Exporters', () => {
  const sampleChunks: ChunkMetadata[] = [
    {
      id: 'chunk-0',
      index: 0,
      text: 'First chunk with "quotes" and commas, here.',
      startCharIndex: 0,
      endCharIndex: 44,
      charCount: 44,
      tokenCount: 9,
      overlapPrevChars: 0,
      overlapNextChars: 10,
      isOrphan: false,
      sectionHeader: 'Intro',
    },
    {
      id: 'chunk-1',
      index: 1,
      text: 'Second chunk without header.',
      startCharIndex: 34,
      endCharIndex: 62,
      charCount: 28,
      tokenCount: 5,
      overlapPrevChars: 10,
      overlapNextChars: 0,
      isOrphan: false,
    },
  ];

  const config: ChunkingConfig = {
    strategy: 'recursive',
    chunkSize: 400,
    chunkOverlap: 40,
    unit: 'tokens',
    encoding: 'o200k_base',
  };

  it('exports chunks to structured JSON payload', () => {
    const jsonStr = exportChunksToJson(sampleChunks, config, 'API Spec');
    const parsed = JSON.parse(jsonStr);

    expect(parsed.documentTitle).toBe('API Spec');
    expect(parsed.totalChunks).toBe(2);
    expect(parsed.config.strategy).toBe('recursive');
    expect(parsed.chunks.length).toBe(2);
    expect(parsed.chunks[0].sectionHeader).toBe('Intro');
    expect(parsed.chunks[0].tokenCount).toBe(9);
  });

  it('exports chunks to RFC 4180 compliant CSV', () => {
    const csvStr = exportChunksToCsv(sampleChunks);
    const lines = csvStr.split('\n');

    expect(lines[0]).toBe('id,index,tokenCount,charCount,startCharIndex,endCharIndex,sectionHeader,text');
    expect(lines.length).toBe(3);
    // Verifies quotes escaping
    expect(lines[1]).toContain('""quotes""');
  });
});
