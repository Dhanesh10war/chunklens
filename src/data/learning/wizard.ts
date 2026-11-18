import { ChunkingStrategy } from '../../engine/types';
import { WizardQuestion, WizardRecommendation } from './types';

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: 'document-type',
    question: 'What kind of document are you indexing?',
    description: 'The structural format of your corpus dictates which delimiter hierarchy prevents broken clauses.',
    options: [
      {
        id: 'technical-markdown',
        label: 'Technical Docs & Markdown',
        detail: 'API references, developer guides, READMEs with code blocks and headings (#, ##).',
      },
      {
        id: 'financial-tabular',
        label: 'Financial & Tabular Data',
        detail: 'SEC 10-K/10-Q reports, balance sheets, CSV dumps with structured columns.',
      },
      {
        id: 'legal-contracts',
        label: 'Legal Agreements & Policies',
        detail: 'Terms of service, compliance agreements, contracts with cohesive paragraphs.',
      },
      {
        id: 'support-conversations',
        label: 'Support Tickets & FAQs',
        detail: 'Short customer inquiries, conversational chat transcripts, Q&A pairs.',
      },
      {
        id: 'unstructured-prose',
        label: 'Unstructured Articles & Prose',
        detail: 'Essays, news articles, academic whitepapers, mixed general documents.',
      },
    ],
  },
  {
    id: 'retrieval-goal',
    question: 'What is your primary retrieval objective?',
    description: 'Balancing search hit precision against the context richness required for generation.',
    options: [
      {
        id: 'high-precision',
        label: 'Pinpoint Fact & Definition Retrieval',
        detail: 'Users ask exact questions looking for specific facts, error codes, or definitions.',
      },
      {
        id: 'balanced-qa',
        label: 'Balanced Conversational QA',
        detail: 'General purpose assistant answering questions that synthesize 2–4 sentences.',
      },
      {
        id: 'broad-synthesis',
        label: 'Broad Topic Synthesis & Reasoning',
        detail: 'Complex multi-step reasoning requiring entire sections, background, and nuances.',
      },
    ],
  },
  {
    id: 'model-family',
    question: 'Which model ecosystem powers your pipeline?',
    description: 'Matching tokenizers avoids vocabulary mismatches and unexpected vector truncation.',
    options: [
      {
        id: 'frontier-multimodal',
        label: 'Frontier Multimodal (o200k_base)',
        detail: 'Optimized multilingual compression and high coding token density.',
      },
      {
        id: 'dense-embeddings',
        label: 'Dense Embedding Models (cl100k_base)',
        detail: 'Industry standard for text-embedding-3, Ada, and modern vector stores.',
      },
      {
        id: 'open-weights',
        label: 'Open-Weights & Local Models',
        detail: 'Llama-family, Mistral, sentence-transformers, or local BGE models.',
      },
    ],
  },
];

export function computeWizardRecommendation(
  answers: Record<string, string>
): WizardRecommendation {
  const docType = answers['document-type'] || 'unstructured-prose';
  const goal = answers['retrieval-goal'] || 'balanced-qa';
  const model = answers['model-family'] || 'dense-embeddings';

  const encoding =
    model === 'frontier-multimodal'
      ? 'o200k_base'
      : model === 'open-weights'
      ? 'cl100k_base'
      : 'cl100k_base';

  let strategy: ChunkingStrategy = 'recursive';
  let chunkSize = 400;
  let chunkOverlap = 40;
  let separators = ['\n\n', '\n', ' ', ''];
  let rationale = '';
  const bestPractices: string[] = [];

  // Determine Strategy based on Document Type
  if (docType === 'financial-tabular') {
    strategy = 'tabular';
    chunkSize = goal === 'high-precision' ? 384 : goal === 'broad-synthesis' ? 650 : 512;
    chunkOverlap = Math.round(chunkSize * 0.12);
    rationale =
      'Tabular documents require row-aware chunking with header persistence. Every partition keeps column labels intact so numeric values retain context.';
    bestPractices.push('Ensure CSV headers are preserved across split boundaries.');
    bestPractices.push('Use at least 10% overlap to capture multi-row transactions.');
  } else if (docType === 'technical-markdown') {
    strategy = 'markdown';
    chunkSize = goal === 'high-precision' ? 300 : goal === 'broad-synthesis' ? 550 : 384;
    chunkOverlap = Math.round(chunkSize * 0.10);
    separators = ['\n## ', '\n### ', '\n\n', '\n', ' '];
    rationale =
      'Technical documentation is inherently hierarchical. Markdown AST splitting groups code blocks with their respective parent heading breadcrumbs.';
    bestPractices.push('Never split a code block in the middle of a function.');
    bestPractices.push('Preserve H1/H2 header breadcrumbs in chunk metadata.');
  } else if (docType === 'legal-contracts') {
    strategy = 'recursive';
    chunkSize = goal === 'high-precision' ? 450 : goal === 'broad-synthesis' ? 800 : 600;
    chunkOverlap = Math.round(chunkSize * 0.15);
    separators = ['\n\n', '\n', ' ', ''];
    rationale =
      'Legal agreements encapsulate binding clauses within complete paragraphs. Recursive paragraph splitting prevents severing reciprocal obligations and indemnities.';
    bestPractices.push('Avoid cutting clauses before the ending period.');
    bestPractices.push('Use 15% overlap to maintain cross-reference definitions (e.g. "as defined in Section 2.1").');
  } else if (docType === 'support-conversations') {
    strategy = 'sentence';
    chunkSize = goal === 'high-precision' ? 200 : goal === 'broad-synthesis' ? 400 : 256;
    chunkOverlap = Math.round(chunkSize * 0.12);
    separators = ['. ', '? ', '! ', '\n', ' '];
    rationale =
      'Conversational transcripts and FAQs consist of short turn-based dialogues. Sentence splitting creates clean, bite-sized embeddings for search matching.';
    bestPractices.push('Keep Q&A turn pairs within the same chunk wherever possible.');
    bestPractices.push('Pair with a re-ranker to boost relevant answers over general greetings.');
  } else {
    // Unstructured prose / articles
    strategy = 'recursive';
    chunkSize = goal === 'high-precision' ? 280 : goal === 'broad-synthesis' ? 600 : 400;
    chunkOverlap = Math.round(chunkSize * 0.10);
    separators = ['\n\n', '\n', ' ', ''];
    rationale =
      'Recursive character splitting offers the most reliable semantic fallback, descending from paragraphs down to sentences and words only when necessary.';
    bestPractices.push('Keep paragraph boundaries (\\n\\n) at the top of your delimiter hierarchy.');
    bestPractices.push('Verify boundary continuity in the Similarity Heatmap to avoid context cliffs.');
  }

  return {
    strategyName: `${strategy.charAt(0).toUpperCase() + strategy.slice(1)}-Aware Splitting`,
    config: {
      strategy,
      chunkSize,
      chunkOverlap,
      unit: 'tokens',
      encoding,
      separators,
    },
    rationale,
    bestPractices,
  };
}
