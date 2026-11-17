import { describe, it, expect } from 'vitest';
import { RAG_ARCHETYPES } from '../archetypes';
import { SAMPLE_DOCUMENTS } from '../samples';

describe('RAG Archetypes Data Integrity', () => {
  it('contains 4 production archetypes with complete configurations', () => {
    expect(RAG_ARCHETYPES).toHaveLength(4);

    RAG_ARCHETYPES.forEach((archetype) => {
      expect(archetype.id).toBeTruthy();
      expect(archetype.name).toBeTruthy();
      expect(archetype.badge).toBeTruthy();
      expect(archetype.description).toBeTruthy();
      expect(archetype.config.chunkSize).toBeGreaterThan(0);
      expect(archetype.config.chunkOverlap).toBeGreaterThan(0);
      expect(archetype.config.chunkOverlap).toBeLessThan(archetype.config.chunkSize);
      expect(archetype.benefits.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('links each archetype to a verified sample document', () => {
    const validSampleIds = new Set(SAMPLE_DOCUMENTS.map((s) => s.id));

    RAG_ARCHETYPES.forEach((archetype) => {
      expect(validSampleIds.has(archetype.sampleId)).toBe(true);
    });
  });
});
