import { DomainPreset } from './types';

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: 'financial-10k',
    name: 'Financial Reports & SEC Filings',
    category: 'Finance',
    description: 'Tabular-aware row retention with 500-token budget to keep balance sheets and numeric footnotes together.',
    typicalCorpus: 'SEC 10-K / 10-Q filings, earnings reports, corporate balance sheets, audit statements.',
    iconName: 'TrendingUp',
    recommendedConfig: {
      strategy: 'tabular',
      chunkSize: 512,
      chunkOverlap: 64,
      unit: 'tokens',
      encoding: 'cl100k_base',
      separators: ['\n\n', '\n', ' ', ''],
    },
    rationale:
      'Financial tables lose meaning when split horizontally without header context. Tabular mode duplicates column headers across partitions, and a 512-token ceiling captures complex multi-line footnote clauses without truncation.',
  },
  {
    id: 'legal-contracts',
    name: 'Legal Contracts & Agreements',
    category: 'Legal',
    description: 'Paragraph-aware boundaries ensuring clauses, definitions, and indemnity provisions are not sliced mid-sentence.',
    typicalCorpus: 'Master services agreements, privacy policies, NDAs, employment contracts, bylaws.',
    iconName: 'Shield',
    recommendedConfig: {
      strategy: 'recursive',
      chunkSize: 600,
      chunkOverlap: 80,
      unit: 'tokens',
      encoding: 'o200k_base',
      separators: ['\n\n', '\n', ' ', ''],
    },
    rationale:
      'Legal definitions and reciprocal liabilities are frequently articulated in long cohesive paragraphs. Breaking mid-clause introduces severe hallucination risks in automated compliance verification.',
  },
  {
    id: 'codebases-docs',
    name: 'Codebases & Technical Docs',
    category: 'Engineering',
    description: 'Markdown AST-aware chunking preserving section hierarchy (#, ##, ###) and syntax-delimited code blocks.',
    typicalCorpus: 'Developer documentation, API reference guides, GitHub READMEs, OpenAPI specs.',
    iconName: 'Code',
    recommendedConfig: {
      strategy: 'markdown',
      chunkSize: 384,
      chunkOverlap: 40,
      unit: 'tokens',
      encoding: 'o200k_base',
      separators: ['\n## ', '\n### ', '\n\n', '\n', ' '],
    },
    rationale:
      'Technical documentation relies on parent heading breadcrumbs to contextualize parameters and error codes. A tighter 384-token target delivers high search precision for specific method names.',
  },
  {
    id: 'support-faqs',
    name: 'Customer Support & Knowledge Bases',
    category: 'Customer Ops',
    description: 'Sentence-aware small chunks for pinpoint retrieval in conversational assistant workflows.',
    typicalCorpus: 'Help desk knowledge bases, support tickets, troubleshooting runbooks, product FAQs.',
    iconName: 'HelpCircle',
    recommendedConfig: {
      strategy: 'sentence',
      chunkSize: 256,
      chunkOverlap: 30,
      unit: 'tokens',
      encoding: 'cl100k_base',
      separators: ['. ', '? ', '! ', '\n', ' '],
    },
    rationale:
      'FAQ queries ("What is your refund policy?") benefit from short, high-density chunks with minimal noise. A 256-token ceiling helps ensure that retrieved context matches user intent directly.',
  },
  {
    id: 'academic-research',
    name: 'Academic Research & Whitepapers',
    category: 'Research',
    description: 'Recursive hierarchy preserving methodology sections, formula blocks, and citation contexts.',
    typicalCorpus: 'Scientific papers, medical journals, arXiv preprints, technical whitepapers.',
    iconName: 'BookOpen',
    recommendedConfig: {
      strategy: 'recursive',
      chunkSize: 450,
      chunkOverlap: 50,
      unit: 'tokens',
      encoding: 'cl100k_base',
      separators: ['\n\n', '\n', '. ', ' ', ''],
    },
    rationale:
      'Academic texts feature dense citations and multi-sentence arguments. Recursive splitting provides graceful fallback from paragraph transitions down to individual sentences without severing citation keys.',
  },
];
