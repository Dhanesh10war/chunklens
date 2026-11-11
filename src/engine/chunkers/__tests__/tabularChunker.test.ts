import { describe, it, expect } from 'vitest';
import { chunkTabular } from '../tabularChunker';
import { ChunkingConfig } from '../../types';

describe('chunkTabular', () => {
  const sampleCsv = `id,product_name,category,price_usd,stock_level
101,Aperture Precision Mouse,Electronics,89.99,120
102,Mechanical Cobalt Keyboard,Electronics,149.50,45
103,Ergonomic Obsidian Desk,Furniture,499.00,12
104,Noise Cancelling Headset,Audio,199.99,80
105,Studio Monitor Speakers,Audio,299.00,30
106,Solid Wood Monitor Riser,Furniture,65.00,150
107,Braided USB-C Cable,Accessories,19.99,500
108,Ultra-wide Curved Monitor,Electronics,749.00,15`;

  const baseConfig: ChunkingConfig = {
    strategy: 'tabular',
    chunkSize: 180,
    chunkOverlap: 40,
    unit: 'characters',
    encoding: 'cl100k_base',
  };

  it('prepends column schema header to every generated CSV chunk', () => {
    const chunks = chunkTabular(sampleCsv, baseConfig);

    expect(chunks.length).toBeGreaterThan(1);
    const headerLine = 'id,product_name,category,price_usd,stock_level';

    chunks.forEach((chunk) => {
      expect(chunk.text.startsWith(headerLine)).toBe(true);
      expect(chunk.sectionHeader).toContain('Schema: id,product_name');
      expect(chunk.isOrphan).toBe(false);
    });
  });

  it('preserves complete rows without breaking cells mid-line', () => {
    const chunks = chunkTabular(sampleCsv, baseConfig);

    chunks.forEach((chunk) => {
      const lines = chunk.text.split('\n');
      // Line 0 is header
      expect(lines[0]).toBe('id,product_name,category,price_usd,stock_level');
      // Every subsequent line is a valid CSV data row with 5 comma-separated values
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].split(',').length).toBe(5);
      }
    });
  });

  it('supports token-based chunk size measurement', () => {
    const tokenConfig: ChunkingConfig = {
      strategy: 'tabular',
      chunkSize: 50,
      chunkOverlap: 10,
      unit: 'tokens',
      encoding: 'o200k_base',
    };

    const chunks = chunkTabular(sampleCsv, tokenConfig);
    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.text).toContain('id,product_name,category,price_usd,stock_level');
      expect(chunk.tokenCount).toBeGreaterThan(0);
    });
  });

  it('chunks JSON array of objects with schema extraction', () => {
    const sampleJson = JSON.stringify([
      { id: 1, name: 'Alpha', score: 95 },
      { id: 2, name: 'Beta', score: 88 },
      { id: 3, name: 'Gamma', score: 72 },
      { id: 4, name: 'Delta', score: 91 },
      { id: 5, name: 'Epsilon', score: 84 },
    ]);

    const jsonConfig: ChunkingConfig = {
      strategy: 'tabular',
      chunkSize: 90,
      chunkOverlap: 0,
      unit: 'characters',
      encoding: 'cl100k_base',
    };

    const chunks = chunkTabular(sampleJson, jsonConfig);
    expect(chunks.length).toBeGreaterThan(1);

    chunks.forEach((chunk) => {
      expect(chunk.text).toContain('// Schema: [id, name, score]');
      expect(chunk.sectionHeader).toContain('JSON Schema: [id, name, score]');
    });
  });

  it('handles single header line or empty payload gracefully', () => {
    expect(chunkTabular('', baseConfig)).toEqual([]);
    expect(chunkTabular('   ', baseConfig)).toEqual([]);

    const singleLine = 'id,name,value';
    const singleResult = chunkTabular(singleLine, baseConfig);
    expect(singleResult.length).toBe(1);
    expect(singleResult[0].text).toBe(singleLine);
  });
});
