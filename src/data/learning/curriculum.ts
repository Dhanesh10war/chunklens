import { LearningPathId } from '../../utils/learningProgress';

export interface LessonMeta {
  slug: string;
  title: string;
  moduleId: string;
  readTime: string;
  status: 'available' | 'planned';
  prerequisites: string[]; // Recommendations, non-blocking
  summary: string;
  pathIds: LearningPathId[];
}

export interface ModuleMeta {
  id: string;
  title: string;
  description: string;
  lessons: LessonMeta[];
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'm0-quickstart',
    title: 'Module 0: Quickstart & The Mental Model',
    description: 'Establish the core mental model of text partitioning in client-side LLM workflows.',
    lessons: [
      {
        slug: '0-1-mental-model',
        title: '0.1 The Mental Model of Document Chunking',
        moduleId: 'm0-quickstart',
        readTime: '4 min',
        status: 'planned',
        prerequisites: [],
        summary: 'Understand why large documents cannot be treated as monolithic strings in AI pipelines.',
        pathIds: ['beginner'],
      },
      {
        slug: '0-2-first-eval',
        title: '0.2 Your First Partition Evaluation',
        moduleId: 'm0-quickstart',
        readTime: '5 min',
        status: 'planned',
        prerequisites: ['0-1-mental-model'],
        summary: 'Step through uploading a document, inspecting chunk boundaries, and reading token metrics.',
        pathIds: ['beginner'],
      },
    ],
  },
  {
    id: 'm1-rag-foundations',
    title: 'Module 1: RAG Foundations',
    description: 'Deep dive into retrieval-augmented generation architectures, lifecycle stages, and failure modes.',
    lessons: [
      {
        slug: '1-1-what-is-rag',
        title: '1.1 What is RAG? (Retrieval-Augmented Generation)',
        moduleId: 'm1-rag-foundations',
        readTime: '6 min',
        status: 'available',
        prerequisites: [],
        summary: 'The 5-stage lifecycle of RAG pipelines and how chunking governs retrieval precision.',
        pathIds: ['beginner'],
      },
      {
        slug: '1-2-failure-modes',
        title: '1.2 The Classic Failure Modes of RAG',
        moduleId: 'm1-rag-foundations',
        readTime: '5 min',
        status: 'planned',
        prerequisites: ['1-1-what-is-rag'],
        summary: 'Context cliffs, semantic dilution, hallucinations, and lost-in-the-middle degradation.',
        pathIds: ['beginner'],
      },
      {
        slug: '1-3-rag-triad',
        title: '1.3 The RAG Evaluation Triad',
        moduleId: 'm1-rag-foundations',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['1-1-what-is-rag'],
        summary: 'Measuring Context Relevance, Groundedness, and Answer Relevance.',
        pathIds: ['beginner'],
      },
    ],
  },
  {
    id: 'm2-document-ingestion',
    title: 'Module 2: Document Ingestion & Structure',
    description: 'Parsing multi-format files while preserving semantic hierarchy.',
    lessons: [
      {
        slug: '2-1-plain-text-markdown',
        title: '2.1 Plain Text & Markdown Structures',
        moduleId: 'm2-document-ingestion',
        readTime: '5 min',
        status: 'planned',
        prerequisites: ['1-1-what-is-rag'],
        summary: 'Leveraging headers, code blocks, and list hierarchies as natural split points.',
        pathIds: ['beginner'],
      },
      {
        slug: '2-2-pdfs-layouts',
        title: '2.2 PDFs, Columns & Visual Layouts',
        moduleId: 'm2-document-ingestion',
        readTime: '7 min',
        status: 'planned',
        prerequisites: ['2-1-plain-text-markdown'],
        summary: 'Extracting text streams without scrambling multi-column reading order.',
        pathIds: ['beginner'],
      },
      {
        slug: '2-3-tables-csv',
        title: '2.3 Tables, CSVs & Schema Retention',
        moduleId: 'm2-document-ingestion',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['2-1-plain-text-markdown'],
        summary: 'Prepend column definitions to every chunk to eliminate hallucinated headers.',
        pathIds: ['beginner'],
      },
      {
        slug: '2-4-code-semistructured',
        title: '2.4 Code, JSON & Semistructured Payloads',
        moduleId: 'm2-document-ingestion',
        readTime: '5 min',
        status: 'planned',
        prerequisites: ['2-1-plain-text-markdown'],
        summary: 'Balancing bracket closure with token density in structured documents.',
        pathIds: ['beginner'],
      },
    ],
  },
  {
    id: 'm3-chunking-fundamentals',
    title: 'Module 3: Chunking Fundamentals',
    description: 'The mathematics and mechanics of text splitting, size limits, and overlap windows.',
    lessons: [
      {
        slug: '3-1-why-chunking-matters',
        title: '3.1 Why Chunking Strategy Dictates System Quality',
        moduleId: 'm3-chunking-fundamentals',
        readTime: '5 min',
        status: 'planned',
        prerequisites: ['1-1-what-is-rag'],
        summary: 'How splitting decisions propagate through embedding geometry and prompt attention.',
        pathIds: ['beginner', 'builder'],
      },
      {
        slug: '3-2-the-size-trade-off',
        title: '3.2 The Chunk Size Trade-Off: Precision vs Context',
        moduleId: 'm3-chunking-fundamentals',
        readTime: '7 min',
        status: 'available',
        prerequisites: ['1-1-what-is-rag'],
        summary: 'Quantitative trade-offs between tiny focused snippets and large explanatory passages.',
        pathIds: ['beginner', 'builder'],
      },
      {
        slug: '3-3-overlap-context-cliffs',
        title: '3.3 Overlap Windows & Preventing Context Cliffs',
        moduleId: 'm3-chunking-fundamentals',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Calibrating overlap percentages (10–20%) to bridge boundary discontinuities.',
        pathIds: ['beginner', 'builder'],
      },
      {
        slug: '3-4-core-strategies',
        title: '3.4 The 5 Core Splitting Strategies Compared',
        moduleId: 'm3-chunking-fundamentals',
        readTime: '8 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Fixed-size, Recursive, Markdown, Sentence, and Tabular strategies side-by-side.',
        pathIds: ['builder'],
      },
    ],
  },
  {
    id: 'm4-tokenization-embeddings',
    title: 'Module 4: Tokenization & Embedding Geometry',
    description: 'Byte-pair encoding, vocabulary spaces, and semantic distance functions.',
    lessons: [
      {
        slug: '4-1-bpe-tokens',
        title: '4.1 Characters vs Bytes vs BPE Tokens',
        moduleId: 'm4-tokenization-embeddings',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Why character counts mislead and how BPE subword merges behave across languages.',
        pathIds: ['builder'],
      },
      {
        slug: '4-2-encoding-families',
        title: '4.2 Frontier Tokenizer Encodings (o200k vs cl100k)',
        moduleId: 'm4-tokenization-embeddings',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['4-1-bpe-tokens'],
        summary: 'Vocabulary compression differences between GPT-4o and earlier model generations.',
        pathIds: ['builder'],
      },
      {
        slug: '4-3-embeddings-geometry',
        title: '4.3 What Dense Embeddings Actually Capture',
        moduleId: 'm4-tokenization-embeddings',
        readTime: '7 min',
        status: 'planned',
        prerequisites: ['4-1-bpe-tokens'],
        summary: 'Geometric proximity, semantic clustering, and high-dimensional vector spaces.',
        pathIds: ['builder'],
      },
      {
        slug: '4-4-distance-metrics',
        title: '4.4 Cosine Similarity vs Dot Product vs Euclidean Distance',
        moduleId: 'm4-tokenization-embeddings',
        readTime: '5 min',
        status: 'planned',
        prerequisites: ['4-3-embeddings-geometry'],
        summary: 'Mathematical trade-offs and when unit vector normalization matters.',
        pathIds: ['builder'],
      },
    ],
  },
  {
    id: 'm5-advanced-architectures',
    title: 'Module 5: Advanced Chunking Architectures',
    description: 'Hierarchical indexes, context enrichment, and agentic workflows.',
    lessons: [
      {
        slug: '5-1-parent-child',
        title: '5.1 Hierarchical Parent-Child Indexing',
        moduleId: 'm5-advanced-architectures',
        readTime: '7 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Index small child chunks for vector search, inject large parent chunks for generation.',
        pathIds: ['builder'],
      },
      {
        slug: '5-2-context-enrichment',
        title: '5.2 Document Metadata & Summary Enrichment',
        moduleId: 'm5-advanced-architectures',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['5-1-parent-child'],
        summary: 'Prepending document titles and synthetic section summaries to every chunk.',
        pathIds: ['builder'],
      },
      {
        slug: '5-3-semantic-chunking',
        title: '5.3 Dynamic Semantic Boundary Chunking',
        moduleId: 'm5-advanced-architectures',
        readTime: '8 min',
        status: 'planned',
        prerequisites: ['4-3-embeddings-geometry'],
        summary: 'Using cosine distance between sequential sentences to find natural semantic break points.',
        pathIds: ['builder'],
      },
    ],
  },
  {
    id: 'm6-retrieval-reranking',
    title: 'Module 6: Retrieval & Re-Ranking',
    description: 'Sparse lexical search, dense vector retrieval, hybrid fusion, and cross-encoders.',
    lessons: [
      {
        slug: '6-1-dense-vs-sparse',
        title: '6.1 Dense Vector Search vs Sparse BM25',
        moduleId: 'm6-retrieval-reranking',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['1-1-what-is-rag'],
        summary: 'Why semantic vectors miss exact serial numbers, and why BM25 misses synonyms.',
        pathIds: ['operator'],
      },
      {
        slug: '6-2-hybrid-rrf',
        title: '6.2 Hybrid Search & Reciprocal Rank Fusion (RRF)',
        moduleId: 'm6-retrieval-reranking',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['6-1-dense-vs-sparse'],
        summary: 'Combining rank lists without brittle floating-point score calibration.',
        pathIds: ['operator'],
      },
      {
        slug: '6-3-cross-encoders',
        title: '6.3 Cross-Encoder Re-Ranking',
        moduleId: 'm6-retrieval-reranking',
        readTime: '7 min',
        status: 'planned',
        prerequisites: ['6-2-hybrid-rrf'],
        summary: 'Joint query-document cross-attention scoring for top-k precision.',
        pathIds: ['operator'],
      },
    ],
  },
  {
    id: 'm7-evaluation-optimization',
    title: 'Module 7: Evaluation & Matrix Analysis',
    description: 'Detecting semantic bloat, orphan chunks, and context utilization with visual heatmaps.',
    lessons: [
      {
        slug: '7-1-heatmap-interpretation',
        title: '7.1 Interpreting Pairwise Chunk Similarity Heatmaps',
        moduleId: 'm7-evaluation-optimization',
        readTime: '7 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Diagnosing off-diagonal redundancy, block diagonal clusters, and disconnected passages.',
        pathIds: ['operator'],
      },
      {
        slug: '7-2-detecting-bloat',
        title: '7.2 Spotting Semantic Bloat & Orphan Chunks',
        moduleId: 'm7-evaluation-optimization',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['7-1-heatmap-interpretation'],
        summary: 'Flagging residual chunks and deduplicating high-similarity non-adjacent chunks.',
        pathIds: ['operator'],
      },
      {
        slug: '7-3-chunk-utilization',
        title: '7.3 Measuring Chunk Utilization & Token Waste',
        moduleId: 'm7-evaluation-optimization',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['7-1-heatmap-interpretation'],
        summary: 'Calculating the percentage of retrieved tokens cited in the final LLM synthesis.',
        pathIds: ['operator'],
      },
    ],
  },
  {
    id: 'm8-production-playbooks',
    title: 'Module 8: Domain Production Playbooks',
    description: 'Tailored chunking configurations for real-world industry domains.',
    lessons: [
      {
        slug: '8-1-legal-compliance',
        title: '8.1 Legal Contracts & Regulatory Compliance',
        moduleId: 'm8-production-playbooks',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Clause-aware recursive splitting with strict section number preservation.',
        pathIds: ['builder'],
      },
      {
        slug: '8-2-tech-docs',
        title: '8.2 Technical Documentation & API References',
        moduleId: 'm8-production-playbooks',
        readTime: '6 min',
        status: 'planned',
        prerequisites: ['3-2-the-size-trade-off'],
        summary: 'Keeping code examples attached to their explanatory endpoints.',
        pathIds: ['builder'],
      },
      {
        slug: '8-3-financial-filings',
        title: '8.3 Financial Filings (10-K, 10-Q & Balance Sheets)',
        moduleId: 'm8-production-playbooks',
        readTime: '7 min',
        status: 'planned',
        prerequisites: ['2-3-tables-csv'],
        summary: 'Retaining fiscal year headers across dense balance sheet tables.',
        pathIds: ['builder'],
      },
    ],
  },
];

export const PATH_DESCRIPTIONS: Record<LearningPathId, { title: string; subtitle: string; summary: string }> = {
  beginner: {
    title: 'Beginner Path',
    subtitle: 'From zero to intuitive understanding of RAG',
    summary: 'Focuses on the mental model, pipeline stages, document structures, and core trade-offs.',
  },
  builder: {
    title: 'Builder Path',
    subtitle: 'For engineers designing retrieval systems',
    summary: 'Dives into tokenization mechanics, advanced architectures, and domain-specific playbooks.',
  },
  operator: {
    title: 'Operator Path',
    subtitle: 'For production teams evaluating retrieval quality',
    summary: 'Focuses on retrieval fusion, cross-encoders, heatmap matrix analysis, and cost optimization.',
  },
};

export function getAllLessons(): LessonMeta[] {
  return MODULES.flatMap((m) => m.lessons);
}

export function findLessonBySlug(slug: string): LessonMeta | undefined {
  return getAllLessons().find((l) => l.slug === slug);
}
