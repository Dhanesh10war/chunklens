import { describe, it, expect } from 'vitest';
import { parseLearnMarkdown, slugify, stripClaimAnnotations } from '../parser';
import { parseInline } from '../inlineParser';

describe('Learn Track Markdown & Directive Parser', () => {
  it('generates deterministic URL-safe heading IDs via slugify', () => {
    expect(slugify('What is RAG?')).toBe('what-is-rag');
    expect(slugify('  The 5-Stage Lifecycle (v2.0)  ')).toBe('the-5-stage-lifecycle-v20');
    expect(slugify('Tokens vs. Characters: 100% Truth')).toBe('tokens-vs-characters-100-truth');
  });

  it('strips claim annotations without leaving comments in rendered output', () => {
    const raw = `
# Title
<!-- claim: [STANDARD KNOWLEDGE] RAG separates retrieval from generation. -->
Text here.
<!-- claim: [CHUNKLENS BEHAVIOR VERIFIED] Runs locally. -->
`;
    const stripped = stripClaimAnnotations(raw);
    expect(stripped).not.toContain('<!-- claim:');
    expect(stripped).not.toContain('STANDARD KNOWLEDGE');
    expect(stripped).toContain('# Title');
    expect(stripped).toContain('Text here.');
  });

  it('parses headings, paragraphs, lists, code blocks, and blockquotes', () => {
    const md = `
# Main Heading
A simple paragraph with explanation.

## Sub Heading
- Item one
- Item two
1. Step one
2. Step two

> A blockquote insight.

\`\`\`typescript
const x = 42;
\`\`\`
`;
    const parsed = parseLearnMarkdown(md);
    expect(parsed.title).toBe('Main Heading');
    expect(parsed.headings).toHaveLength(2);
    expect(parsed.headings[0].id).toBe('main-heading');
    expect(parsed.headings[1].id).toBe('sub-heading');

    const types = parsed.blocks.map((b) => b.type);
    expect(types).toContain('heading');
    expect(types).toContain('paragraph');
    expect(types).toContain('list');
    expect(types).toContain('blockquote');
    expect(types).toContain('code');
  });

  it('parses block directives: :::widget, :::callout, :::quiz, :::tryit, :::compare', () => {
    const md = `
:::callout[note]{title="Key Insight"}
Remember to measure chunk size in tokens.
:::

:::widget[v1-pipeline]{}
:::

:::compare{left="Small" right="Large"}
Short snippets
===
Long passages
:::

:::tryit[academic-paper]{strategy="recursive" chunkSize="400" chunkOverlap="40"}
:::

:::quiz[quiz-1-1]{}
:::
`;
    const parsed = parseLearnMarkdown(md);
    const types = parsed.blocks.map((b) => b.type);
    expect(types).toEqual(['callout', 'widget', 'compare', 'tryit', 'quiz']);

    const callout = parsed.blocks[0] as any;
    expect(callout.calloutType).toBe('note');
    expect(callout.title).toBe('Key Insight');
    expect(callout.content).toContain('measure chunk size in tokens');

    const widget = parsed.blocks[1] as any;
    expect(widget.widgetId).toBe('v1-pipeline');

    const compare = parsed.blocks[2] as any;
    expect(compare.leftTitle).toBe('Small');
    expect(compare.rightTitle).toBe('Large');
    expect(compare.leftContent).toBe('Short snippets');
    expect(compare.rightContent).toBe('Long passages');

    const tryit = parsed.blocks[3] as any;
    expect(tryit.presetId).toBe('academic-paper');
    expect(tryit.props.chunkSize).toBe('400');

    const quiz = parsed.blocks[4] as any;
    expect(quiz.quizId).toBe('quiz-1-1');
  });

  it('parses inline formatting: bold, italic, code, links, and glossary terms', () => {
    const inlineText = 'Here is **bold**, *italic*, `code()`, [external](https://example.com), and [[rag|RAG definition]].';
    const tokens = parseInline(inlineText);

    expect(tokens.some((t) => t.type === 'bold' && t.content === 'bold')).toBe(true);
    expect(tokens.some((t) => t.type === 'italic' && t.content === 'italic')).toBe(true);
    expect(tokens.some((t) => t.type === 'code' && t.content === 'code()')).toBe(true);
    expect(tokens.some((t) => t.type === 'link' && t.url === 'https://example.com')).toBe(true);
    expect(tokens.some((t) => t.type === 'glossary' && t.termId === 'rag' && t.label === 'RAG definition')).toBe(true);
  });
});
