import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LearningCenterView } from '../learning/LearningCenterView';
import { LearningModal } from '../learning/LearningModal';
import { DecisionWizardWidget } from '../learning/DecisionWizardWidget';

describe('Learning Center & Documentation Components', () => {
  it('renders LearningCenterView with all 4 tab buttons and default manual view', () => {
    const html = renderToString(<LearningCenterView defaultTab="manual" />);

    // Tabs
    expect(html).toContain('User Manual');
    expect(html).toContain('RAG Academy');
    expect(html).toContain('Presets &amp; Wizard');
    expect(html).toContain('Glossary &amp; Shortcuts');

    // Default article content
    expect(html).toContain('Feature Guides');
    expect(html).toContain('Visual Chunk Inspector');
  });

  it('renders LearningCenterView with RAG Academy tab when selected', () => {
    const html = renderToString(<LearningCenterView defaultTab="academy" />);

    expect(html).toContain('Masterclass Modules');
    expect(html).toContain('Executive Key Takeaways');
    expect(html).toContain('Level:');
  });

  it('renders LearningCenterView with Presets and Wizard tab', () => {
    const html = renderToString(<LearningCenterView defaultTab="presets" />);

    expect(html).toContain('Interactive RAG Decision Wizard');
    expect(html).toContain('Calibrated Production Domain Presets');
    expect(html).toContain('Financial Reports &amp; SEC Filings');
    expect(html).toContain('Legal Contracts &amp; Agreements');
  });

  it('renders LearningCenterView with Glossary and Shortcuts tab', () => {
    const html = renderToString(<LearningCenterView defaultTab="glossary" />);

    expect(html).toContain('ChunkLens Global Keyboard Shortcuts');
    expect(html).toContain('RAG &amp; Vector Search Technical Glossary');
    expect(html).toContain('BM25 (Best Matching 25)');
    expect(html).toContain('Reciprocal Rank Fusion (RRF)');
  });

  it('renders DecisionWizardWidget stepper with initial question', () => {
    const html = renderToString(<DecisionWizardWidget />);

    expect(html).toContain('Step 1 of 3');
    expect(html).toContain('What kind of document are you indexing?');
    expect(html).toContain('Technical Docs &amp; Markdown');
  });

  it('renders LearningModal with dialog ARIA attributes when open', () => {
    const html = renderToString(
      <LearningModal isOpen={true} onClose={() => {}} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="learning-modal-title"');
    expect(html).toContain('User Manual &amp; RAG Academy');
  });

  it('returns null for LearningModal when closed', () => {
    const html = renderToString(
      <LearningModal isOpen={false} onClose={() => {}} />
    );

    expect(html).toBe('');
  });
});
