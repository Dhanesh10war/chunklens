import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LearnView } from '../LearnView';
import { MODULES, getAllLessons } from '../../../data/learning/curriculum';
import { GLOSSARY_TERMS, findGlossaryTerm } from '../../../data/learning/glossary';
import { QUIZZES } from '../../../data/learning/quizzes';
import { GlossaryPopover } from '../GlossaryPopover';
import { QuizWidget } from '../QuizWidget';
import { V1PipelineFlowExplorer } from '../widgets/V1PipelineFlowExplorer';
import { V2ChunkSandbox } from '../widgets/V2ChunkSandbox';

describe('Learn Track Curriculum & View Components', () => {
  it('defines all 8 modules with valid metadata and non-empty lessons', () => {
    expect(MODULES).toHaveLength(9); // M0, M1, M2, M3, M4, M5, M6, M7, M8
    const all = getAllLessons();
    expect(all.length).toBeGreaterThanOrEqual(25);

    const available = all.filter((l) => l.status === 'available');
    expect(available.map((l) => l.slug)).toContain('1-1-what-is-rag');
    expect(available.map((l) => l.slug)).toContain('3-2-the-size-trade-off');
  });

  it('renders Curriculum Map with header, paths, and modules', () => {
    const html = renderToString(
      <LearnView
        currentLessonSlug={null}
        onNavigateLesson={vi.fn()}
        onLaunchWorkbench={vi.fn()}
        onOpenLanding={vi.fn()}
      />
    );

    expect(html).toContain('ChunkLens Learn Track');
    expect(html).toContain('Beginner Path');
    expect(html).toContain('Builder Path');
    expect(html).toContain('Operator Path');
    expect(html).toContain('Module 1: RAG Foundations');
    expect(html).toContain('1.1 What is RAG? (Retrieval-Augmented Generation)');
    expect(html).toContain('3.2 The Chunk Size Trade-Off: Precision vs Context');
    expect(html).toContain('Available');
  });

  it('renders Lesson 1.1 with breadcrumbs, TL;DR, and key takeaways', () => {
    const html = renderToString(
      <LearnView
        currentLessonSlug="1-1-what-is-rag"
        onNavigateLesson={vi.fn()}
        onLaunchWorkbench={vi.fn()}
        onOpenLanding={vi.fn()}
      />
    );

    expect(html).toContain('1.1 What is RAG? (Retrieval-Augmented Generation)');
    expect(html).toContain('TL;DR');
    expect(html).toContain('The 5-Stage RAG Lifecycle');
    expect(html).toContain('Key Takeaways');
    expect(html).toContain('Back to Curriculum Map');
  });

  it('renders Lesson 3.2 with worked example and comparison section', () => {
    const html = renderToString(
      <LearnView
        currentLessonSlug="3-2-the-size-trade-off"
        onNavigateLesson={vi.fn()}
        onLaunchWorkbench={vi.fn()}
        onOpenLanding={vi.fn()}
      />
    );

    expect(html).toContain('The Chunk Size Trade-Off: Precision vs Context');
    expect(html).toContain('The Precision-Context Spectrum');
    expect(html).toContain('A Worked Example: The Severed Antecedent');
    expect(html).toContain('Tokens vs Characters');
  });

  it('renders GlossaryPopover with trigger button and accessible attributes', () => {
    const term = findGlossaryTerm('rag');
    expect(term).toBeDefined();

    const html = renderToString(
      <GlossaryPopover termId="rag" label="RAG architecture" />
    );

    expect(html).toContain('RAG architecture');
    expect(html).toContain('aria-haspopup="dialog"');
  });

  it('contains comprehensive glossary entries without banned marketing claims', () => {
    expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(15);
    const termsJoined = JSON.stringify(GLOSSARY_TERMS);

    // Verify banned claims are absent
    expect(termsJoined).not.toContain('industry benchmark');
    expect(termsJoined).not.toContain('industry-standard');
    expect(termsJoined).not.toContain('guaranteed');
  });

  it('renders QuizWidget with questions and accessible options', () => {
    const quiz = QUIZZES['quiz-1-1'];
    expect(quiz).toBeDefined();

    const html = renderToString(<QuizWidget quizId="quiz-1-1" />);

    expect(html).toContain('Check Your Understanding: RAG Foundations');
    expect(html).toContain('Self-Check');
    expect(html).toContain('Check Answers');
    expect(html).toContain('aria-live="polite"');
  });

  it('renders V1PipelineFlowExplorer with 5 lifecycle stages and Illustration badge', () => {
    const html = renderToString(<V1PipelineFlowExplorer />);

    expect(html).toContain('Illustration');
    expect(html).toContain('RAG Pipeline Flow Simulator');
    expect(html).toContain('Ingest');
    expect(html).toContain('Chunk');
    expect(html).toContain('Embed');
    expect(html).toContain('Retrieve');
    expect(html).toContain('Generate');
    expect(html).toContain('Accessible Table');
  });

  it('renders V2ChunkSandbox with Real engine badge and live controls', () => {
    const html = renderToString(
      <V2ChunkSandbox
        initialStrategy="recursive"
        initialChunkSize={400}
        initialChunkOverlap={40}
        initialSampleId="api-reference"
      />
    );

    expect(html).toContain('Real engine');
    expect(html).toContain('Live Document Chunking Sandbox');
    expect(html).toContain('Strategy');
    expect(html).toContain('Size');
    expect(html).toContain('Overlap');
    expect(html).toContain('Open Full Workbench');
  });
});
