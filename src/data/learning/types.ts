import { ChunkingConfig } from '../../engine/types';

export interface ManualFeatureArticle {
  id: string;
  title: string;
  summary: string;
  badge: string;
  category: 'inspector' | 'chunking' | 'tokenizers' | 'heatmap' | 'exporters' | 'security';
  readTime: string;
  sections: {
    heading: string;
    content: string;
    codeSnippet?: {
      language: string;
      code: string;
    };
    callout?: {
      type: 'tip' | 'note' | 'warning';
      text: string;
    };
  }[];
}

export interface RagAcademyModule {
  id: string;
  title: string;
  subtitle: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'fundamentals' | 'trade-offs' | 'architectures' | 'evaluation';
  readTime: string;
  keyTakeaways: string[];
  sections: {
    heading: string;
    paragraphs: string[];
    diagramAscii?: string;
    keyMetric?: {
      label: string;
      value: string;
      note: string;
    };
  }[];
}

export interface DomainPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  recommendedConfig: ChunkingConfig;
  rationale: string;
  typicalCorpus: string;
  iconName: string;
}

export interface GlossaryTerm {
  term: string;
  category: 'Vector Search' | 'Chunking' | 'Evaluation' | 'LLM Architecture';
  definition: string;
  formulaOrExample?: string;
  seeAlso?: string[];
}

export interface WizardQuestion {
  id: string;
  question: string;
  description: string;
  options: {
    id: string;
    label: string;
    detail: string;
  }[];
}

export interface WizardRecommendation {
  strategyName: string;
  config: ChunkingConfig;
  rationale: string;
  bestPractices: string[];
}
