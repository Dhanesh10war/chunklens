import { describe, it, expect } from 'vitest';
import { MANUAL_ARTICLES } from '../manualContent';
import { RAG_ACADEMY_MODULES } from '../ragAcademyContent';
import { DOMAIN_PRESETS } from '../presets';
import { GLOSSARY_TERMS } from '../glossary';
import { computeWizardRecommendation, WIZARD_QUESTIONS } from '../wizard';

describe('Learning Center & Documentation Data Layer', () => {
  it('loads valid manual articles with required sections and badges', () => {
    expect(MANUAL_ARTICLES.length).toBeGreaterThanOrEqual(6);
    for (const article of MANUAL_ARTICLES) {
      expect(article.id).toBeDefined();
      expect(article.title.length).toBeGreaterThan(5);
      expect(article.sections.length).toBeGreaterThanOrEqual(2);
      expect(article.badge).toBeDefined();
      expect(article.readTime).toContain('min read');
    }
  });

  it('loads rich RAG academy modules covering beginner, intermediate, and advanced', () => {
    expect(RAG_ACADEMY_MODULES.length).toBeGreaterThanOrEqual(4);
    const levels = new Set(RAG_ACADEMY_MODULES.map((m) => m.level));
    expect(levels.has('Beginner')).toBe(true);
    expect(levels.has('Intermediate')).toBe(true);
    expect(levels.has('Advanced')).toBe(true);

    for (const mod of RAG_ACADEMY_MODULES) {
      expect(mod.keyTakeaways.length).toBeGreaterThanOrEqual(2);
      expect(mod.sections.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('loads domain presets with valid ChunkConfig properties', () => {
    expect(DOMAIN_PRESETS.length).toBeGreaterThanOrEqual(5);
    for (const preset of DOMAIN_PRESETS) {
      expect(preset.recommendedConfig.chunkSize).toBeGreaterThan(0);
      expect(preset.recommendedConfig.chunkOverlap).toBeGreaterThan(0);
      expect(preset.recommendedConfig.unit).toBe('tokens');
      expect(preset.recommendedConfig.separators?.length).toBeGreaterThan(0);
    }
  });

  it('provides comprehensive glossary terms with definitions', () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(8);
    for (const term of GLOSSARY_TERMS) {
      expect(term.term.length).toBeGreaterThan(2);
      expect(term.definition.length).toBeGreaterThan(20);
    }
  });

  it('computes accurate wizard recommendations for different document types', () => {
    expect(WIZARD_QUESTIONS.length).toBe(3);

    // Test Financial Tabular recommendation
    const finRec = computeWizardRecommendation({
      'document-type': 'financial-tabular',
      'retrieval-goal': 'balanced-qa',
      'model-family': 'dense-embeddings',
    });
    expect(finRec.config.strategy).toBe('tabular');
    expect(finRec.config.chunkSize).toBe(512);

    // Test Technical Markdown recommendation
    const mdRec = computeWizardRecommendation({
      'document-type': 'technical-markdown',
      'retrieval-goal': 'high-precision',
      'model-family': 'frontier-multimodal',
    });
    expect(mdRec.config.strategy).toBe('markdown');
    expect(mdRec.config.encoding).toBe('o200k_base');
    expect(mdRec.config.chunkSize).toBe(300);

    // Test Legal Contracts recommendation
    const legalRec = computeWizardRecommendation({
      'document-type': 'legal-contracts',
      'retrieval-goal': 'broad-synthesis',
      'model-family': 'dense-embeddings',
    });
    expect(legalRec.config.strategy).toBe('recursive');
    expect(legalRec.config.chunkSize).toBe(800);
  });
});
