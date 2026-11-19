import { ManualFeatureArticle } from './types';

export const MANUAL_ARTICLES: ManualFeatureArticle[] = [
  {
    id: 'visual-chunk-inspector',
    title: 'Visual Chunk Inspector & Reading Column',
    summary: 'Analyze chunk boundaries, token budget saturation meters, and overlap bands in real time.',
    badge: 'Core Feature',
    category: 'inspector',
    readTime: '4 min read',
    sections: [
      {
        heading: '1. Continuous Reading Column vs. Grid View',
        content:
          'ChunkLens provides two primary visualization modes for inspecting chunk boundaries. The Continuous Reading Column (Stream View) renders each chunk sequentially in document order with visual overlap bridge bands. This view lets you verify narrative flow and check whether sentence or paragraph boundaries were cleanly preserved. The Grid View displays chunks as a card catalog for scanning token distributions and metadata at a glance.',
      },
      {
        heading: '2. Token Budget Saturation Meter',
        content:
          'Every chunk card displays a proportional token saturation bar scaled against a standard 512-token budget threshold:\n\n• Safe Zone (<= 384 tokens): Rendered with high-contrast text and a balanced background tint, indicating optimal room for system prompts and user queries.\n• Warning Zone (385–511 tokens): Alert indicator signaling that the chunk is approaching common dense embedding ceiling limits.\n• Overflow Zone (>= 512 tokens): Flagged in red to prevent unexpected model truncation during downstream vector indexing.',
        callout: {
          type: 'tip',
          text: 'Embedding models like sentence-transformers and text-embedding-3 degrade in retrieval accuracy if text exceeds their internal positional context window. Aim for 256–384 tokens for dense vector retrieval.',
        },
      },
      {
        heading: '3. Diagonal Overlap Bridge Bands',
        content:
          'When overlap is configured (> 0), ChunkLens renders a diagonal hatch pattern bridge between adjacent chunk cards. This ribbon explicitly calculates the exact number of overlapping characters and tokens, verifying that pronouns, noun phrases, and topic transitions are not severed at partition edges.',
      },
      {
        heading: '4. Orphan Chunk Detection & Structural Headers',
        content:
          'An orphan chunk occurs when a heading (e.g. "Section 4.1 Requirements") is detached from its succeeding body paragraph because of strict token limits. ChunkLens flags orphan headers with a warning badge and automatically extracts breadcrumbs to preserve hierarchical document context.',
      },
    ],
  },
  {
    id: 'chunking-strategies-guide',
    title: 'Chunking Strategies: Choosing the Right Delimiter Hierarchy',
    summary: 'A deep-dive into Recursive, Sentence, Paragraph, Markdown AST, Tabular, and Fixed slicing.',
    badge: 'Strategy Guide',
    category: 'chunking',
    readTime: '6 min read',
    sections: [
      {
        heading: '1. Recursive Splitting (The Gold Standard)',
        content:
          'Recursive character splitting attempts to split text using a hierarchical list of delimiters in order of semantic preservation: double newlines ("\\n\\n") for paragraphs, single newlines ("\\n") for lines, spaces (" ") for words, and empty string ("") as a fallback for long unbroken tokens. It creates the most natural semantic chunks across unstructured documents.',
        codeSnippet: {
          language: 'python',
          code: `from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base",
    chunk_size=400,
    chunk_overlap=40,
    separators=["\\n\\n", "\\n", " ", ""]
)`,
        },
      },
      {
        heading: '2. Sentence-Aware Splitting',
        content:
          'Uses punctuation boundaries (periods, exclamation points, question marks, and line breaks) to ensure that complete sentences remain unbroken. Recommended for conversational transcripts, clinical notes, and editorial articles where half-sentences produce misleading embeddings.',
      },
      {
        heading: '3. Paragraph-Aware Splitting',
        content:
          'Enforces that entire paragraphs are preserved intact. Chunks only break at double newlines unless a single paragraph exceeds the maximum token limit. Essential for legal agreements, terms of service, and dense technical specifications where paragraph clauses carry distinct legal meaning.',
      },
      {
        heading: '4. Markdown AST & Header-Aware Splitting',
        content:
          'Parses Markdown syntax to split strictly at heading boundaries (# H1, ## H2, ### H3). Every chunk retains its parent section title as a metadata attribute, preventing context drift when chunks are retrieved independently in a vector store.',
      },
      {
        heading: '5. Tabular & CSV Row-Aware Splitting',
        content:
          'Structured spreadsheets and CSV tables present unique challenges for vector search: if a chunk starts mid-table without column headers, numeric values lose their meaning. ChunkLens tabular mode attaches header rows to every chunk partition, preserving column association across split table boundaries.',
        callout: {
          type: 'note',
          text: 'When indexing financial data or tabular matrices, row-aware chunking helps ensure header preservation.',
        },
      },
    ],
  },
  {
    id: 'unit-tokenizer-selection',
    title: 'Unit & Tokenizer Selection: Tokens vs. Characters',
    summary: 'Why character limits mislead, and how BPE tokenization differences affect indexing costs.',
    badge: 'Tokenization',
    category: 'tokenizers',
    readTime: '5 min read',
    sections: [
      {
        heading: '1. Why Character Splitting Leads to Pipeline Failures',
        content:
          'A common pitfall in AI pipelines is configuring chunk size in characters (e.g. 1,000 characters). Because token density varies drastically depending on whitespace, code formatting, unicode symbols, and multilingual text, a 1,000-character chunk can represent anywhere from 180 tokens (dense English prose) to 850 tokens (heavily indented code, JSON, or non-Latin scripts). ChunkLens evaluates partitions directly in real BPE tokens to verify model compliance.',
      },
      {
        heading: '2. Supported Encodings in ChunkLens',
        content:
          '• o200k_base: Byte-Pair Encoding used in leading frontier multimodal LLMs. Highly optimized for multilingual compression and source code.\n• cl100k_base: The widely adopted tokenizer used across dense embedding models and modern frontier chat models.\n• Llama / Open-Weights Approximation: 32k/128k vocabulary tokenizer used in open-source model ecosystems.\n• Claude / Anthropic Approximation: Character-to-token ratio calibration modeled on frontier conversational assistants.',
      },
      {
        heading: '3. Measuring Tokenizer Variance Across Models',
        content:
          'Different tokenizers produce different chunk counts for identical source text. ChunkLens provides a side-by-side comparison modal that highlights vocabulary efficiency, token count divergence, and estimated embedding costs per 1,000,000 tokens.',
      },
    ],
  },
  {
    id: 'similarity-heatmap-continuity',
    title: 'Similarity Heatmap & Boundary Continuity Metrics',
    summary: 'Detect context cliffs, semantic dead-ends, and redundant vector duplicates with matrix analytics.',
    badge: 'Analytics',
    category: 'heatmap',
    readTime: '5 min read',
    sections: [
      {
        heading: '1. The Lexical Similarity Matrix Explained',
        content:
          'The Similarity Heatmap computes pairwise cosine and Jaccard similarity across all chunks in your document. The diagonal represents self-similarity (100%), while off-diagonal cells indicate semantic overlap between distant sections. Adjacent cells (diagonal + 1) measure boundary continuity.',
      },
      {
        heading: '2. Spotting "Context Cliffs"',
        content:
          'A Context Cliff occurs when adjacent boundary continuity drops below 20%. This indicates that an abrupt split occurred mid-thought or mid-sentence, stranding essential antecedent context in the preceding chunk. When this happens, increase your overlap window or switch to Recursive splitting.',
        callout: {
          type: 'warning',
          text: 'Chunks with boundary continuity below 20% frequently cause hallucination in question-answering systems because the model lacks preceding references.',
        },
      },
      {
        heading: '3. Spotting "Semantic Bloat & Redundancy"',
        content:
          'Off-diagonal cells with similarity exceeding 70% represent redundant document regions. In production vector databases, storing near-duplicate chunks wastes index memory and inflates retrieval latency without improving answer quality.',
      },
      {
        heading: '4. Keyboard Navigation in the Matrix',
        content:
          'Use the 2D arrow keys (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) to navigate across the matrix cells. The side inspector updates in real time to display chunk text, shared keywords, and similarity score.',
      },
    ],
  },
  {
    id: 'code-and-data-exporters',
    title: 'Exporting Production Code & Vector Datasets',
    summary: 'Generate drop-in Python and TypeScript splitters, or export JSONL and CSV for vector databases.',
    badge: 'Integration',
    category: 'exporters',
    readTime: '3 min read',
    sections: [
      {
        heading: '1. Drop-In Splitter Code',
        content:
          'Once you calibrate your target chunk size, overlap window, and delimiter hierarchy in ChunkLens, open the Export dialog (Cmd+E / Ctrl+E) to export ready-to-run code for LangChain (Python), LlamaIndex (Python), LangChain (TypeScript), or native regex splitters.',
      },
      {
        heading: '2. Vector Database Ready Datasets (JSONL & CSV)',
        content:
          'Export partitioned chunks directly into JSONL or CSV format. Every record includes chunk id, index, text content, token count, character offsets, section headers, and overlap metadata ready for batch upsert into Pinecone, Qdrant, Chroma, Weaviate, or PostgreSQL pgvector.',
      },
    ],
  },
  {
    id: 'zero-egress-security-model',
    title: 'Zero-Egress Architecture & Native PDF Processing',
    summary: 'How ChunkLens processes documents completely inside your browser with strict local isolation.',
    badge: 'Security',
    category: 'security',
    readTime: '3 min read',
    sections: [
      {
        heading: '1. 100% Client-Side In-Browser Execution',
        content:
          'ChunkLens never transmits your documents, credentials, or telemetry to an external server. Tokenization, chunking, PDF extraction, and similarity matrix calculations run entirely in browser Web Workers and WebAssembly.',
      },
      {
        heading: '2. Strict Content Security Policy (CSP)',
        content:
          'A strict Content Security Policy (default-src "self", connect-src "none") enforces that no network sockets, WebSockets, or HTTP requests can be initiated by the application. Fonts, tokenizer vocabularies, and PDF engines are self-hosted locally.',
      },
      {
        heading: '3. Session Persistence & Ephemeral Storage',
        content:
          'Documents are stored locally in your browser localStorage only if you enable "Remember my document". You can instantly wipe all stored chunks and session settings at any time using the "Clear Saved Data" action in the header menu.',
      },
    ],
  },
];
