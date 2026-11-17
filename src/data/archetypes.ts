import { ChunkingConfig } from '../engine/types';

export interface RagArchetype {
  id: string;
  name: string;
  badge: string;
  description: string;
  targetWorkload: string;
  sampleId: string;
  config: ChunkingConfig;
  benefits: string[];
}

export const RAG_ARCHETYPES: RagArchetype[] = [
  {
    id: 'api-sdk',
    name: 'Developer API & SDK Docs',
    badge: 'API & Code',
    description: 'Preserves endpoint contracts, curl snippets, parameters tables, and code blocks without mid-syntax truncation.',
    targetWorkload: 'Developer Portals, Agent Tool Calling, Code RAG',
    sampleId: 'api-reference',
    config: {
      strategy: 'recursive',
      chunkSize: 400,
      chunkOverlap: 40,
      unit: 'tokens',
      encoding: 'o200k_base',
    },
    benefits: ['400 tok density', '10% overlap guard', 'Code block preservation'],
  },
  {
    id: 'legal-contracts',
    name: 'Legal Agreements & Compliance',
    badge: 'Legal & Contracts',
    description: 'Preserves defined terms, indemnification caps, statutory sub-clauses, and liability cross-references.',
    targetWorkload: 'Contract Review, Due Diligence, Regulatory Audits',
    sampleId: 'legal-contract',
    config: {
      strategy: 'markdown',
      chunkSize: 800,
      chunkOverlap: 80,
      unit: 'tokens',
      encoding: 'o200k_base',
    },
    benefits: ['800 tok scope', 'Clause integrity', 'Header hierarchy context'],
  },
  {
    id: 'financial-tabular',
    name: 'Financial 10-K & Tabular Reports',
    badge: 'Finance & Tables',
    description: 'Row-preserving tabular parsing that keeps column headers attached to line items and quarterly revenue metrics.',
    targetWorkload: 'Earnings Reports, SEC Filings, CSV Databases',
    sampleId: 'financial-report',
    config: {
      strategy: 'tabular',
      chunkSize: 500,
      chunkOverlap: 50,
      unit: 'tokens',
      encoding: 'o200k_base',
    },
    benefits: ['500 tok budget', 'Table row continuity', 'Markdown table alignment'],
  },
  {
    id: 'dense-qa',
    name: 'Academic Papers & Deep QA',
    badge: 'Dense Search',
    description: 'High vector density for pinpoint cosine similarity lookup, semantic question-answering, and abstract search.',
    targetWorkload: 'Research Assistants, Scientific QA, Knowledge Bases',
    sampleId: 'academic-paper',
    config: {
      strategy: 'sentence',
      chunkSize: 250,
      chunkOverlap: 25,
      unit: 'tokens',
      encoding: 'o200k_base',
    },
    benefits: ['250 tok granularity', 'High cosine sensitivity', 'Sentence boundary lock'],
  },
];
