export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  rationale: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export const QUIZZES: Record<string, QuizData> = {
  'quiz-0-1': {
    id: 'quiz-0-1',
    title: 'Check Your Understanding: The Mental Model of Document Chunking',
    questions: [
      {
        id: 'q1',
        prompt: 'Why cannot engineering teams simply submit a 100-page manual as a single monolithic string to an embedding model?',
        options: [
          {
            id: 'a',
            text: 'Dense embedding models map the entire text into a single vector, causing severe semantic dilution across unrelated topics.',
            isCorrect: true,
            rationale: 'Correct! An embedding model produces a single fixed-dimension vector. Averaging hundreds of distinct topics into one vector destroys the geometric proximity needed to retrieve specific facts.',
          },
          {
            id: 'b',
            text: 'Vector databases are physically incapable of storing strings longer than 1,000 characters.',
            isCorrect: false,
            rationale: 'Vector databases can store arbitrary document metadata payloads; the bottleneck is embedding model positional limits and vector similarity resolution.',
          },
          {
            id: 'c',
            text: 'Large language models cannot parse text that contains more than three paragraphs.',
            isCorrect: false,
            rationale: 'Modern LLMs readily process large contexts, but submitting raw monolithic files introduces severe latency, economic waste, and attention degradation.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What defines an effective, production-ready document chunk?',
        options: [
          {
            id: 'a',
            text: 'A passage that maintains topical singularity and semantic completeness so it can answer queries standalone.',
            isCorrect: true,
            rationale: 'Correct! A production chunk should contain a coherent semantic idea along with the context or conditions needed to resolve internal references.',
          },
          {
            id: 'b',
            text: 'Any string cut at exactly 500 characters regardless of whether words or sentences are split.',
            isCorrect: false,
            rationale: 'Arbitrary character slicing creates context cliffs and severs words, destroying retrieval quality.',
          },
          {
            id: 'c',
            text: 'A chunk that contains zero punctuation or structural formatting.',
            isCorrect: false,
            rationale: 'Punctuation and structural cues are essential for maintaining grammatical coherence in LLM synthesis.',
          },
        ],
      },
    ],
  },
  'quiz-0-2': {
    id: 'quiz-0-2',
    title: 'Check Your Understanding: Your First Partition Evaluation',
    questions: [
      {
        id: 'q1',
        prompt: 'When evaluating chunk metrics in ChunkLens, what does a wide token spread (e.g., [45 - 890 tokens]) indicate?',
        options: [
          {
            id: 'a',
            text: 'Unpredictable partition geometry that risks downstream embedding model truncation on oversized chunks.',
            isCorrect: true,
            rationale: 'Correct! A wide token spread signals that the splitting delimiters are failing to evenly segment the text, risking silent truncation on chunks that exceed model ceilings.',
          },
          {
            id: 'b',
            text: 'Optimal vocabulary compression across all supported models.',
            isCorrect: false,
            rationale: 'A wide variance in chunk size has nothing to do with tokenizer compression quality; it indicates inconsistent document splitting.',
          },
          {
            id: 'c',
            text: 'A corrupted browser cache requiring a page refresh.',
            isCorrect: false,
            rationale: 'Token metrics accurately reflect the physical character and token distributions of the parsed document.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary diagnostic purpose of the diagonal overlap band in the Continuous Stream view?',
        options: [
          {
            id: 'a',
            text: 'To visually verify that pronouns, qualifying clauses, and antecedents are duplicated across adjacent boundaries.',
            isCorrect: true,
            rationale: 'Correct! The overlap band reveals the exact duplicated text bridging Chunk N and Chunk N+1, ensuring narrative continuity is preserved.',
          },
          {
            id: 'b',
            text: 'To indicate which chunks will be deleted during deduplication.',
            isCorrect: false,
            rationale: 'Overlap bands display intentional boundary bridging, not chunks marked for deletion.',
          },
          {
            id: 'c',
            text: 'To measure browser Web Worker memory allocation.',
            isCorrect: false,
            rationale: 'The overlap band is a visual lexical inspector, not a memory profiler.',
          },
        ],
      },
    ],
  },
  'quiz-1-1': {
    id: 'quiz-1-1',
    title: 'Check Your Understanding: RAG Foundations',
    questions: [
      {
        id: 'q1',
        prompt: 'Why does a RAG architecture split documents into chunks instead of passing entire multi-megabyte manuals directly to the LLM?',
        options: [
          {
            id: 'a',
            text: 'Because LLMs cannot read English documents longer than 1,000 words.',
            isCorrect: false,
            rationale: 'Modern LLMs have context windows of 128k tokens or more, but stuffing massive documents introduces distraction ("lost-in-the-middle"), high latency, and excessive token cost.',
          },
          {
            id: 'b',
            text: 'To extract only relevant passages, minimizing noise and fitting targeted context into the prompt budget.',
            isCorrect: true,
            rationale: 'Correct! Splitting documents into focused chunks allows the retrieval system to pinpoint the specific paragraphs containing the answer, preserving model attention and reducing token expenses.',
          },
          {
            id: 'c',
            text: 'Because vector databases cannot store text longer than 256 characters.',
            isCorrect: false,
            rationale: 'Vector databases store embeddings and metadata payloads of any reasonable size; the constraint stems from embedding model input limits and retrieval precision, not database storage.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'In a standard RAG pipeline, which component is responsible for turning textual chunks into dense numerical vectors?',
        options: [
          {
            id: 'a',
            text: 'The embedding model.',
            isCorrect: true,
            rationale: 'Correct! Embedding models (e.g. text-embedding-3-small) convert text into fixed-dimensional vectors that capture semantic meaning for similarity search.',
          },
          {
            id: 'b',
            text: 'The BPE tokenizer alone.',
            isCorrect: false,
            rationale: 'Tokenizers convert characters into discrete integer token IDs, but they do not produce continuous semantic vector embeddings.',
          },
          {
            id: 'c',
            text: 'The web browser cache.',
            isCorrect: false,
            rationale: 'The cache merely retains data locally; it performs no mathematical transformations.',
          },
        ],
      },
    ],
  },
  'quiz-1-2': {
    id: 'quiz-1-2',
    title: 'Check Your Understanding: Classic Failure Modes of RAG',
    questions: [
      {
        id: 'q1',
        prompt: 'What constitutes a "Context Cliff" in a retrieval pipeline?',
        options: [
          {
            id: 'a',
            text: 'When a chunk boundary splits a clause mid-sentence, divorcing a rule or statement from its subject or antecedent.',
            isCorrect: true,
            rationale: 'Correct! A context cliff occurs when text is severed abruptly, causing the retrieved chunk to lack the grammatical subject or conditions needed for the LLM to understand it.',
          },
          {
            id: 'b',
            text: 'When a vector database drops connections due to high network traffic.',
            isCorrect: false,
            rationale: 'Context cliffs are algorithmic information loss failures in text splitting, not network infrastructure issues.',
          },
          {
            id: 'c',
            text: 'When an embedding model outputs vectors with negative cosine similarity.',
            isCorrect: false,
            rationale: 'Negative or low cosine similarity is normal in high-dimensional spaces; it does not define a context cliff.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'According to empirical research by Liu et al. (2023), what is the "Lost in the Middle" attention degradation?',
        options: [
          {
            id: 'a',
            text: 'LLMs retrieve and recall facts positioned at the beginning or end of input prompts significantly better than facts positioned in the middle.',
            isCorrect: true,
            rationale: 'Correct! Research demonstrates that transformer self-attention exhibits a U-shaped accuracy curve: facts positioned in the middle of long multi-chunk prompts suffer up to a 30% drop in retrieval accuracy.',
          },
          {
            id: 'b',
            text: 'Tokenizers lose accuracy when processing punctuation in the exact middle of a file.',
            isCorrect: false,
            rationale: 'Tokenizers process byte sequences deterministically regardless of position.',
          },
          {
            id: 'c',
            text: 'Vector databases only search the first and last partitions of any document index.',
            isCorrect: false,
            rationale: 'Vector databases search across all indexed vectors uniformly.',
          },
        ],
      },
    ],
  },
  'quiz-1-3': {
    id: 'quiz-1-3',
    title: 'Check Your Understanding: The RAG Evaluation Triad',
    questions: [
      {
        id: 'q1',
        prompt: 'In the RAG Triad framework, what does the "Context Relevance" metric specifically evaluate?',
        options: [
          {
            id: 'a',
            text: 'The proportion of sentences in the retrieved context chunks that are directly relevant to answering the query.',
            isCorrect: true,
            rationale: 'Correct! Context Relevance measures the signal-to-noise ratio of the retrieved passages, evaluating whether retrieval pulled focused facts or extraneous text.',
          },
          {
            id: 'b',
            text: 'Whether the LLM response contains valid JSON syntax.',
            isCorrect: false,
            rationale: 'JSON formatting is a schema validation check, not a context relevance metric.',
          },
          {
            id: 'c',
            text: 'The latency of the embedding generation in milliseconds.',
            isCorrect: false,
            rationale: 'Context relevance is a semantic quality metric, not a system latency metric.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'If a document chunker produces fragmented micro-chunks that sever qualifying caveats, which Triad metric collapses first?',
        options: [
          {
            id: 'a',
            text: 'Groundedness (Faithfulness), because the model must hallucinate missing context to answer.',
            isCorrect: true,
            rationale: 'Correct! When retrieved chunks lack the complete context, the LLM attempts to bridge the missing facts with ungrounded parametric assumptions, directly lowering Groundedness.',
          },
          {
            id: 'b',
            text: 'Browser WebAssembly compilation speed.',
            isCorrect: false,
            rationale: 'WASM compilation is a runtime platform process independent of chunk semantics.',
          },
          {
            id: 'c',
            text: 'The physical disk space of the local device.',
            isCorrect: false,
            rationale: 'Disk space has no bearing on algorithmic faithfulness.',
          },
        ],
      },
    ],
  },
  'quiz-2-1': {
    id: 'quiz-2-1',
    title: 'Check Your Understanding: Plain Text & Markdown Structures',
    questions: [
      {
        id: 'q1',
        prompt: 'Why is heading breadcrumb propagation essential for markdown child chunks?',
        options: [
          {
            id: 'a',
            text: 'It injects the ancestral heading path (e.g. Doc > Section > Subheading), ensuring isolated child chunks retain semantic context during vector search.',
            isCorrect: true,
            rationale: 'Correct! Prepending heading ancestry ensures that child paragraphs retain their topical context even when retrieved independently from the rest of the document.',
          },
          {
            id: 'b',
            text: 'It automatically minifies markdown files for faster network transfer.',
            isCorrect: false,
            rationale: 'Breadcrumb propagation enriches chunk semantics; it is not a minification or compression tool.',
          },
          {
            id: 'c',
            text: 'It converts markdown into binary bytecode.',
            isCorrect: false,
            rationale: 'Markdown remains human-readable text; no binary bytecode is involved.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What happens if a code snippet is severed across a naive chunk boundary?',
        options: [
          {
            id: 'a',
            text: 'The function signature and docstring are detached from implementation, resulting in broken code syntax and poor semantic retrieval.',
            isCorrect: true,
            rationale: 'Correct! Severing code blocks breaks language syntax, detaches explanatory docstrings from function bodies, and forces the LLM to guess incomplete logic.',
          },
          {
            id: 'b',
            text: 'The browser compiler will crash with an out-of-memory error.',
            isCorrect: false,
            rationale: 'Fragmented code does not exhaust browser memory; it causes semantic and syntactic retrieval failures.',
          },
          {
            id: 'c',
            text: 'The tokenizer replaces the code with random whitespace.',
            isCorrect: false,
            rationale: 'Tokenizers encode whatever characters are present; they do not insert random whitespace.',
          },
        ],
      },
    ],
  },
  'quiz-2-2': {
    id: 'quiz-2-2',
    title: 'Check Your Understanding: PDFs, Columns & Visual Layouts',
    questions: [
      {
        id: 'q1',
        prompt: 'Why does naive left-to-right text extraction fail on multi-column PDFs?',
        options: [
          {
            id: 'a',
            text: 'It reads across columns horizontally, merging lines from parallel columns into grammatical gibberish.',
            isCorrect: true,
            rationale: 'Correct! PDFs store placement coordinates rather than semantic flows. A naive horizontal scan interleaves column 1 with column 2, creating unreadable sentences.',
          },
          {
            id: 'b',
            text: 'PDFs can only store a single column of text.',
            isCorrect: false,
            rationale: 'PDFs can display arbitrary visual layouts, including complex multi-column grids and sidebars.',
          },
          {
            id: 'c',
            text: 'Multi-column PDFs automatically encrypt their text streams.',
            isCorrect: false,
            rationale: 'Multi-column formatting has nothing to do with cryptographic encryption.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary problem with leaving repeated running headers and footers in PDF chunks?',
        options: [
          {
            id: 'a',
            text: 'They pollute every chunk with repetitive boilerplate (e.g. copyright, page numbers), diluting vector embeddings.',
            isCorrect: true,
            rationale: 'Correct! Repeating marginal phrases every 300 words dilutes the dense vector representation with irrelevant legal or pagination text.',
          },
          {
            id: 'b',
            text: 'They make the PDF file size 10 times larger.',
            isCorrect: false,
            rationale: 'Headers and footers are a few bytes of text; the issue is semantic dilution in vector embeddings, not file bloat.',
          },
          {
            id: 'c',
            text: 'They cause the BPE tokenizer to throw an invalid syntax exception.',
            isCorrect: false,
            rationale: 'Tokenizers encode boilerplate text cleanly without errors; the failure is in retrieval relevance.',
          },
        ],
      },
    ],
  },
  'quiz-2-3': {
    id: 'quiz-2-3',
    title: 'Check Your Understanding: Tables, CSVs & Schema Retention',
    questions: [
      {
        id: 'q1',
        prompt: 'Why must table header rows be prepended to every chunk partition of a large table?',
        options: [
          {
            id: 'a',
            text: 'Without column headers, data cells become unanchored numbers and dates that cannot be matched by queries looking for specific column metrics.',
            isCorrect: true,
            rationale: 'Correct! A row containing "48.0, 31.2, 35.0%" is meaningless to an embedding model unless the column headers ("Revenue, OpEx, Margin") are attached.',
          },
          {
            id: 'b',
            text: 'Because CSV files cannot be opened unless every chunk has a header.',
            isCorrect: false,
            rationale: 'CSV parsers can parse raw rows; the requirement exists so that vector search and LLMs can interpret the numbers.',
          },
          {
            id: 'c',
            text: 'To reduce the total token count of the document.',
            isCorrect: false,
            rationale: 'Prepending headers actually increases token count slightly, but it is necessary for semantic comprehension.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What trade-off must you budget for when enforcing tabular schema retention?',
        options: [
          {
            id: 'a',
            text: 'Prepending headers consumes a portion of each chunk\'s token budget, reducing the number of data rows that fit per partition.',
            isCorrect: true,
            rationale: 'Correct! Replicating the header across chunks uses tokens from the target budget, meaning fewer data rows fit into each individual chunk.',
          },
          {
            id: 'b',
            text: 'Vector databases charge double for tables with headers.',
            isCorrect: false,
            rationale: 'Vector databases bill by dimension and vector count, not data structure.',
          },
          {
            id: 'c',
            text: 'The table can only be queried in SQL, not vector search.',
            isCorrect: false,
            rationale: 'Header-enriched chunks are specifically designed to enable dense semantic vector search on tabular rows.',
          },
        ],
      },
    ],
  },
  'quiz-2-4': {
    id: 'quiz-2-4',
    title: 'Check Your Understanding: Code, JSON & Semistructured Payloads',
    questions: [
      {
        id: 'q1',
        prompt: 'Why does code and indented JSON have a much higher token density than English prose?',
        options: [
          {
            id: 'a',
            text: 'BPE tokenizers treat punctuation marks, indentation spaces, underscores, and brackets as discrete individual tokens.',
            isCorrect: true,
            rationale: 'Correct! In code, characters like "{", "}", ":", and indentation spaces are rarely merged into multi-letter words, resulting in low characters-per-token ratios (2.0 - 2.8 chars/tok).',
          },
          {
            id: 'b',
            text: 'Programming languages use 16-bit unicode characters exclusively.',
            isCorrect: false,
            rationale: 'Standard code is predominantly ASCII; the token density comes from subword tokenization boundaries on symbols and indentation.',
          },
          {
            id: 'c',
            text: 'Code files are automatically compressed by the browser before tokenization.',
            isCorrect: false,
            rationale: 'No pre-compression is applied; tokenizers evaluate the raw text characters.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'When chunking source code for a RAG knowledge base, why must docstrings remain unified with function bodies?',
        options: [
          {
            id: 'a',
            text: 'Natural language queries match the docstring\'s explanation, but the LLM requires the function body to generate working code.',
            isCorrect: true,
            rationale: 'Correct! If a docstring is severed from its code, vector search finds the docstring but the LLM prompt lacks the implementation needed to answer the user.',
          },
          {
            id: 'b',
            text: 'Docstrings are ignored by embedding models unless they exceed 500 characters.',
            isCorrect: false,
            rationale: 'Embedding models embed all text in the chunk regardless of length.',
          },
          {
            id: 'c',
            text: 'Detached docstrings trigger compiler syntax errors in the browser.',
            isCorrect: false,
            rationale: 'Browser execution is unaffected; the failure is in retrieval relevance and code synthesis.',
          },
        ],
      },
    ],
  },
  'quiz-3-1': {
    id: 'quiz-3-1',
    title: 'Check Your Understanding: Why Chunking Strategy Dictates System Quality',
    questions: [
      {
        id: 'q1',
        prompt: 'How does well-calibrated chunking affect the geometric clustering of embeddings in vector space?',
        options: [
          {
            id: 'a',
            text: 'It produces tight, well-separated topic clusters that yield high cosine similarity matches with minimal noise.',
            isCorrect: true,
            rationale: 'Correct! Clean topical boundaries prevent disparate ideas from being averaged together, creating high angular separation between different concepts in vector space.',
          },
          {
            id: 'b',
            text: 'It forces all vectors to align along a single one-dimensional axis.',
            isCorrect: false,
            rationale: 'Vectors exist in high-dimensional space (e.g. 1536D); they do not collapse to 1D.',
          },
          {
            id: 'c',
            text: 'It randomizes vector angles to maximize database entropy.',
            isCorrect: false,
            rationale: 'Embedding models are deterministic mathematical functions, not random entropy generators.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'Why do query-time inference costs typically dwarf one-time ingestion costs in production RAG?',
        options: [
          {
            id: 'a',
            text: 'Oversized chunks bloat prompt context windows on every recurring user query, multiplying token costs across millions of requests.',
            isCorrect: true,
            rationale: 'Correct! Ingestion happens once when documents are indexed, but oversized chunks are transmitted and processed on every single recurring search query.',
          },
          {
            id: 'b',
            text: 'Embedding models are 1,000 times more expensive than LLM generation.',
            isCorrect: false,
            rationale: 'Embedding models are significantly cheaper per token than LLM generation models.',
          },
          {
            id: 'c',
            text: 'Vector databases charge per gigabyte of read bandwidth on every split.',
            isCorrect: false,
            rationale: 'LLM prompt tokens are the dominant cost center in production RAG systems.',
          },
        ],
      },
    ],
  },
  'quiz-3-2': {
    id: 'quiz-3-2',
    title: 'Check Your Understanding: The Chunk Size Trade-Off',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the primary risk of configuring an excessively large chunk size (e.g., 2,000 tokens) for specific factual question-answering?',
        options: [
          {
            id: 'a',
            text: 'Semantic dilution and noise, where irrelevant surrounding text obscures the exact answer.',
            isCorrect: true,
            rationale: 'Correct! Large chunks dilute the vector embedding across multiple unrelated topics and consume large portions of the prompt context with irrelevant details.',
          },
          {
            id: 'b',
            text: 'The browser will crash due to JavaScript memory exhaustion.',
            isCorrect: false,
            rationale: '2,000 tokens is only ~8 KB of text, which browsers process easily. The failure mode is algorithmic retrieval quality, not memory exhaustion.',
          },
          {
            id: 'c',
            text: 'The chunk will automatically fail strict JSON formatting.',
            isCorrect: false,
            rationale: 'Chunk size has no bearing on JSON syntax validity.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'Conversely, what typically happens when chunk sizes are set too small (e.g., 20 tokens)?',
        options: [
          {
            id: 'a',
            text: 'Vector search speed drops to zero.',
            isCorrect: false,
            rationale: 'Vector search indexing remains fast regardless of chunk size; the issue is semantic completeness.',
          },
          {
            id: 'b',
            text: 'Chunks suffer from context fragmentation, severing pronouns and core facts from their antecedents.',
            isCorrect: true,
            rationale: 'Correct! Micro-chunks strip essential surrounding qualifiers, leaving ambiguous statements like "It was acquired for $2M" without knowing what "It" refers to.',
          },
          {
            id: 'c',
            text: 'Tokenizers cannot count fewer than 50 tokens.',
            isCorrect: false,
            rationale: 'Tokenizers count from 1 token upward with exact fidelity.',
          },
        ],
      },
    ],
  },
  'quiz-3-3': {
    id: 'quiz-3-3',
    title: 'Check Your Understanding: Overlap Windows & Preventing Context Cliffs',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the recommended baseline overlap window percentage for standard document chunking?',
        options: [
          {
            id: 'a',
            text: '10% to 20% of the target chunk size.',
            isCorrect: true,
            rationale: 'Correct! An overlap ratio between 10% and 20% (e.g. 40–80 tokens for a 400-token chunk) reliably bridges boundary discontinuities with minimal vector storage expansion.',
          },
          {
            id: 'b',
            text: '0% (overlap is an unnecessary waste of storage).',
            isCorrect: false,
            rationale: 'Zero overlap creates severe context cliffs where sentences are cut mid-clause.',
          },
          {
            id: 'c',
            text: '50% to 75% of the target chunk size.',
            isCorrect: false,
            rationale: 'Excessive overlap beyond 30% doubles vector storage and floods top-k search with near-duplicate passages.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary retrieval hazard of configuring an excessively large overlap window (e.g. > 35%)?',
        options: [
          {
            id: 'a',
            text: 'Top-k retrieval returns near-identical duplicate passages, crowding out diverse evidence from the prompt.',
            isCorrect: true,
            rationale: 'Correct! When chunks overlap heavily, vector search matches multiple adjacent copies of the same text, starving out other relevant sections of the document.',
          },
          {
            id: 'b',
            text: 'It causes the BPE tokenizer to divide by zero.',
            isCorrect: false,
            rationale: 'Tokenizers encode byte sequences normally regardless of overlap size.',
          },
          {
            id: 'c',
            text: 'It breaks browser Web Worker thread isolation.',
            isCorrect: false,
            rationale: 'Worker thread security is governed by the browser runtime, not text overlap.',
          },
        ],
      },
    ],
  },
  'quiz-3-4': {
    id: 'quiz-3-4',
    title: 'Check Your Understanding: The 5 Core Splitting Strategies Compared',
    questions: [
      {
        id: 'q1',
        prompt: 'Why is Recursive Character Splitting considered the most reliable baseline for unstructured prose?',
        options: [
          {
            id: 'a',
            text: 'Its hierarchical delimiter cascade (paragraphs -> lines -> words) preserves the largest natural grammatical units possible.',
            isCorrect: true,
            rationale: 'Correct! Recursive splitting prioritizes double newlines before single newlines and spaces, ensuring text splits at natural topic breaks whenever possible.',
          },
          {
            id: 'b',
            text: 'It is the only strategy that runs in WebAssembly.',
            isCorrect: false,
            rationale: 'All chunking strategies in ChunkLens run in WebAssembly / Web Workers.',
          },
          {
            id: 'c',
            text: 'It completely eliminates the need for vector embeddings.',
            isCorrect: false,
            rationale: 'Chunking prepares text for embedding; it does not replace it.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'For which document type is the Tabular Splitter strictly required over a recursive character splitter?',
        options: [
          {
            id: 'a',
            text: 'Spreadsheets and CSV files where numeric rows require column schema definitions to be understood.',
            isCorrect: true,
            rationale: 'Correct! Numeric rows lose all meaning without column headers. The Tabular Splitter guarantees that schema headers are attached to every partition.',
          },
          {
            id: 'b',
            text: 'Plain markdown blog posts.',
            isCorrect: false,
            rationale: 'Blog posts are unstructured prose best handled by recursive or markdown splitters.',
          },
          {
            id: 'c',
            text: 'Short conversational chat transcripts.',
            isCorrect: false,
            rationale: 'Chat transcripts are conversational turn structures, not tabular schemas.',
          },
        ],
      },
    ],
  },
  'quiz-4-1': {
    id: 'quiz-4-1',
    title: 'Check Your Understanding: Characters vs Bytes vs BPE Tokens',
    questions: [
      {
        id: 'q1',
        prompt: 'Why does a 500-character block of code or JSON consume significantly more tokens than a 500-character block of English prose?',
        options: [
          {
            id: 'a',
            text: 'BPE tokenizers treat punctuation marks, brackets, and indentation spaces as discrete individual tokens rather than multi-character subwords.',
            isCorrect: true,
            rationale: 'Correct! In code and JSON, symbols like "{", "}", ":", and indentation spaces are rarely merged into multi-letter words, resulting in low characters-per-token ratios (2.0 - 2.8 chars/tok).',
          },
          {
            id: 'b',
            text: 'Code uses 64-bit unicode encoding exclusively.',
            isCorrect: false,
            rationale: 'Standard code is predominantly ASCII; the token density comes from subword tokenization boundaries on symbols and indentation.',
          },
          {
            id: 'c',
            text: 'English prose is automatically translated before tokenization.',
            isCorrect: false,
            rationale: 'No translation occurs; English prose compresses more because of frequent dictionary word merges.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary hazard of configuring chunk size limits in raw characters?',
        options: [
          {
            id: 'a',
            text: 'Character counts fail to enforce strict token limits, causing silent truncation in downstream embedding models when text has high token density.',
            isCorrect: true,
            rationale: 'Correct! A 1,000-character limit can yield 180 tokens for prose or 480+ tokens for JSON, overflowing model context ceilings.',
          },
          {
            id: 'b',
            text: 'Character counters cause browser Web Workers to freeze.',
            isCorrect: false,
            rationale: 'Character length checks are computationally trivial; the hazard is embedding model context overflow.',
          },
          {
            id: 'c',
            text: 'Vector databases reject documents with character counts.',
            isCorrect: false,
            rationale: 'Vector databases accept arbitrary string payloads; the constraint is the embedding model input limit.',
          },
        ],
      },
    ],
  },
  'quiz-4-2': {
    id: 'quiz-4-2',
    title: 'Check Your Understanding: Frontier Tokenizer Encodings (o200k vs cl100k)',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the primary advantage of expanding tokenizer vocabulary size from 100k (cl100k_base) to 200k (o200k_base)?',
        options: [
          {
            id: 'a',
            text: 'Significantly higher compression efficiency across multilingual text and code, cutting token counts by up to 50% for non-Latin alphabets.',
            isCorrect: true,
            rationale: 'Correct! Doubling the vocabulary allows dedicated merges for non-Latin scripts (Devanagari, Arabic, CJK) and code syntax, vastly reducing token inflation.',
          },
          {
            id: 'b',
            text: 'It eliminates the need for vector databases.',
            isCorrect: false,
            rationale: 'Tokenizers encode text for models; they do not replace vector storage.',
          },
          {
            id: 'c',
            text: 'It converts all text to ASCII.',
            isCorrect: false,
            rationale: 'o200k preserves full UTF-8 Unicode characters.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What hazard occurs if a chunker evaluates token budgets with o200k_base but the embedding model uses cl100k_base?',
        options: [
          {
            id: 'a',
            text: 'A chunk that appears safely under budget (e.g. 500 tokens in o200k) will expand to nearly 600 tokens during embedding, causing silent truncation.',
            isCorrect: true,
            rationale: 'Correct! Cross-tokenizer divergence means text takes fewer tokens in o200k than cl100k, so a 500-token o200k chunk can overflow a 512-token cl100k model limit.',
          },
          {
            id: 'b',
            text: 'The model throws a JSON parsing error.',
            isCorrect: false,
            rationale: 'Token count mismatches cause text truncation, not JSON syntax errors.',
          },
          {
            id: 'c',
            text: 'The vector database crashes on insertion.',
            isCorrect: false,
            rationale: 'Databases store the vectors without error; the failure is that the trailing text was truncated prior to embedding.',
          },
        ],
      },
    ],
  },
  'quiz-4-3': {
    id: 'quiz-4-3',
    title: 'Check Your Understanding: What Dense Embeddings Actually Capture',
    questions: [
      {
        id: 'q1',
        prompt: 'Which type of information do dense vector embeddings struggle to retrieve reliably without sparse keyword matching?',
        options: [
          {
            id: 'a',
            text: 'Exact alphanumeric identifiers, serial numbers, error codes, and strict negative constraints.',
            isCorrect: true,
            rationale: 'Correct! Dense embeddings capture conceptual similarity, but struggle to differentiate exact arbitrary codes (like UUIDs or part numbers) and logical negations.',
          },
          {
            id: 'b',
            text: 'Conceptual synonyms and paraphrases.',
            isCorrect: false,
            rationale: 'Paraphrase and synonym matching is the primary strength of dense vectors.',
          },
          {
            id: 'c',
            text: 'Broad subject matter classifications.',
            isCorrect: false,
            rationale: 'Topical classification is naturally captured by vector clustering.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'Why does sizing a chunk too large (e.g. 2,000+ tokens) degrade dense vector retrieval accuracy?',
        options: [
          {
            id: 'a',
            text: 'Pooling compresses the entire passage into a single vector, mathematically averaging multiple unrelated topics and diluting specific factual signals.',
            isCorrect: true,
            rationale: 'Correct! In oversized chunks, the vector represents the mean of all disparate sentences, reducing cosine similarity for specific niche queries.',
          },
          {
            id: 'b',
            text: 'It exceeds the floating-point precision of 32-bit floats.',
            isCorrect: false,
            rationale: 'Vector dimensionality remains fixed (e.g. 1536D) regardless of chunk length; the failure is semantic dilution.',
          },
          {
            id: 'c',
            text: 'It forces the embedding model into an infinite loop.',
            isCorrect: false,
            rationale: 'Transformer encoders process input sequentially; they do not loop infinitely.',
          },
        ],
      },
    ],
  },
  'quiz-4-4': {
    id: 'quiz-4-4',
    title: 'Check Your Understanding: Cosine Similarity vs Dot Product vs Euclidean Distance',
    questions: [
      {
        id: 'q1',
        prompt: 'When embedding vectors are unit-normalized (length = 1), what is the relationship between Cosine Similarity and Dot Product?',
        options: [
          {
            id: 'a',
            text: 'They are mathematically identical and produce strictly identical nearest-neighbor rankings.',
            isCorrect: true,
            rationale: 'Correct! Under unit normalization, the denominator in cosine similarity equals 1, making Cosine Similarity mathematically equivalent to Dot Product.',
          },
          {
            id: 'b',
            text: 'Cosine Similarity is always twice the Dot Product.',
            isCorrect: false,
            rationale: 'They are strictly equal under unit normalization.',
          },
          {
            id: 'c',
            text: 'Dot Product produces inverse rankings compared to Cosine Similarity.',
            isCorrect: false,
            rationale: 'The rankings are identical.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'Why do production vector database indexes prefer Dot Product distance over Cosine Similarity for pre-normalized vectors?',
        options: [
          {
            id: 'a',
            text: 'Dot Product requires only multiply-accumulate operations without computing square roots or magnitude divisions, making ANN search faster.',
            isCorrect: true,
            rationale: 'Correct! Eliminating square-root and division operations allows SIMD and tensor hardware to execute matrix multiplications significantly faster.',
          },
          {
            id: 'b',
            text: 'Dot Product is the only metric that supports HNSW indexing.',
            isCorrect: false,
            rationale: 'HNSW supports cosine, dot product, and L2 distance metrics.',
          },
          {
            id: 'c',
            text: 'Cosine Similarity is deprecated in all vector stores.',
            isCorrect: false,
            rationale: 'Cosine similarity is widely supported across all modern vector stores.',
          },
        ],
      },
    ],
  },
  'quiz-5-1': {
    id: 'quiz-5-1',
    title: 'Check Your Understanding: Hierarchical Parent-Child Indexing',
    questions: [
      {
        id: 'q1',
        prompt: 'How does Hierarchical Parent-Child Indexing resolve the RAG chunk size trade-off?',
        options: [
          {
            id: 'a',
            text: 'It embeds small child chunks (100–200 tokens) for search precision, but retrieves and injects their larger parent passages (800–1,200 tokens) for generation context.',
            isCorrect: true,
            rationale: 'Correct! By decoupling the retrieval unit from the generation unit, it achieves pinpoint vector search without sacrificing rich surrounding context.',
          },
          {
            id: 'b',
            text: 'It generates synthetic summaries of every paragraph.',
            isCorrect: false,
            rationale: 'Parent-child indexing links structural passage hierarchies; it does not require synthetic summarization.',
          },
          {
            id: 'c',
            text: 'It replaces vector databases with relational SQL databases.',
            isCorrect: false,
            rationale: 'It combines vector search for child chunks with document storage for parent passages.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What happens if two child chunks matching a query belong to the same parent document?',
        options: [
          {
            id: 'a',
            text: 'They automatically deduplicate into a single parent retrieval, saving prompt context window space.',
            isCorrect: true,
            rationale: 'Correct! The retriever recognizes the shared parent_id and injects the parent passage only once, eliminating duplicate prompt clutter.',
          },
          {
            id: 'b',
            text: 'The system throws a duplicate key exception.',
            isCorrect: false,
            rationale: 'Parent document retrieval handles deduplication natively as a core feature.',
          },
          {
            id: 'c',
            text: 'The prompt receives two duplicate copies of the parent document.',
            isCorrect: false,
            rationale: 'Proper parent document retrievers deduplicate parent IDs before prompt assembly.',
          },
        ],
      },
    ],
  },
  'quiz-5-2': {
    id: 'quiz-5-2',
    title: 'Check Your Understanding: Document Metadata & Summary Enrichment',
    questions: [
      {
        id: 'q1',
        prompt: 'What is "context blindness" in isolated document chunks?',
        options: [
          {
            id: 'a',
            text: 'When an extracted passage lacks the global document identity, version date, section hierarchy, or geographic scope needed to interpret its statements.',
            isCorrect: true,
            rationale: 'Correct! An isolated chunk does not know which contract, policy, or file version it originated from unless metadata is explicitly prepended.',
          },
          {
            id: 'b',
            text: 'When an embedding model loses floating point precision.',
            isCorrect: false,
            rationale: 'Context blindness is a semantic information deficiency, not numerical floating point drift.',
          },
          {
            id: 'c',
            text: 'When an LLM refuses to generate citations.',
            isCorrect: false,
            rationale: 'Citation generation is a prompt instruction; context blindness happens upstream at ingestion.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the recommended ceiling for metadata token overhead in an enriched chunk?',
        options: [
          {
            id: 'a',
            text: 'No more than 20% to 25% of the total target chunk token budget.',
            isCorrect: true,
            rationale: 'Correct! Capping metadata at 20–25% preserves the majority of the token budget for actual content while providing the necessary structural framing.',
          },
          {
            id: 'b',
            text: 'Exactly 75% of the chunk budget.',
            isCorrect: false,
            rationale: 'Spending 75% on metadata leaves too little room for meaningful content.',
          },
          {
            id: 'c',
            text: 'Zero tokens (metadata should never be included in the text payload).',
            isCorrect: false,
            rationale: 'Prepending metadata into the text payload allows dense vectors to match both concepts and structural categories.',
          },
        ],
      },
    ],
  },
  'quiz-5-3': {
    id: 'quiz-5-3',
    title: 'Check Your Understanding: Dynamic Semantic Boundary Chunking',
    questions: [
      {
        id: 'q1',
        prompt: 'How does dynamic semantic chunking determine where to place partition boundaries?',
        options: [
          {
            id: 'a',
            text: 'It measures the cosine distance between sequential sentence embeddings and places boundaries where distance spikes above a calibrated threshold.',
            isCorrect: true,
            rationale: 'Correct! By monitoring changes in vector direction between adjacent sentences, it cuts boundaries at natural semantic topic shifts.',
          },
          {
            id: 'b',
            text: 'It cuts at fixed character counts regardless of meaning.',
            isCorrect: false,
            rationale: 'Fixed character slicing is syntactic; semantic chunking evaluates vector distance.',
          },
          {
            id: 'c',
            text: 'It counts the number of commas in each paragraph.',
            isCorrect: false,
            rationale: 'Commas are syntactic punctuation, not semantic distance metrics.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary production trade-off of dynamic semantic chunking compared to recursive character splitting?',
        options: [
          {
            id: 'a',
            text: 'It is significantly slower and more computationally expensive because it requires generating embedding vectors for every single sentence during ingestion.',
            isCorrect: true,
            rationale: 'Correct! Calling an embedding model on every sentence multiplies ingestion latency and API cost by 10x to 100x compared to fast regex-based recursive splitting.',
          },
          {
            id: 'b',
            text: 'It cannot process English text.',
            isCorrect: false,
            rationale: 'Semantic chunking works across any language supported by the embedding model.',
          },
          {
            id: 'c',
            text: 'It produces identical chunk sizes across all documents.',
            isCorrect: false,
            rationale: 'Semantic chunking produces variable chunk sizes because topic shifts occur at irregular intervals.',
          },
        ],
      },
    ],
  },
  'quiz-6-1': {
    id: 'quiz-6-1',
    title: 'Check Your Understanding: Dense Vector Search vs Sparse BM25',
    questions: [
      {
        id: 'q1',
        prompt: 'Why does sparse BM25 outperform dense vector retrieval on queries containing exact alphanumeric identifiers (such as error code ERR_404_TIMEOUT or SKU-9921)?',
        options: [
          {
            id: 'a',
            text: 'BM25 computes exact lexical token matches and assigns high inverse document frequency (IDF) weight to rare strings, whereas dense models break unique strings into subword fragments that dilute semantic alignment.',
            isCorrect: true,
            rationale: 'Correct! BM25 values exact string tokens and weights rare strings heavily, whereas dense encoders scatter unfamiliar IDs across subword tokens.',
          },
          {
            id: 'b',
            text: 'BM25 uses neural cross-attention to analyze character n-grams.',
            isCorrect: false,
            rationale: 'BM25 is a frequency-based lexical ranking function, not a neural cross-attention model.',
          },
          {
            id: 'c',
            text: 'Dense embeddings only function on single-letter queries.',
            isCorrect: false,
            rationale: 'Dense embeddings handle multi-sentence text, but struggle with out-of-vocabulary exact codes.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary limitation of sparse lexical retrieval algorithms like BM25 in conversational search?',
        options: [
          {
            id: 'a',
            text: 'The vocabulary mismatch problem: BM25 assigns a score of zero if candidate passages express identical concepts using synonyms or paraphrases not present in the user query.',
            isCorrect: true,
            rationale: 'Correct! BM25 requires exact token overlap; if a user searches for "automobile repair" and the text uses "car servicing", BM25 cannot bridge the vocabulary gap.',
          },
          {
            id: 'b',
            text: 'BM25 requires high-end GPUs to calculate inverted indices.',
            isCorrect: false,
            rationale: 'BM25 runs on standard CPUs with minimal memory overhead.',
          },
          {
            id: 'c',
            text: 'BM25 cannot index documents longer than 100 characters.',
            isCorrect: false,
            rationale: 'BM25 incorporates length normalization specifically to handle documents of any size.',
          },
        ],
      },
    ],
  },
  'quiz-6-2': {
    id: 'quiz-6-2',
    title: 'Check Your Understanding: Hybrid Search & Reciprocal Rank Fusion',
    questions: [
      {
        id: 'q1',
        prompt: 'Why is naive score addition (Score = Dense + BM25) fragile in hybrid search pipelines?',
        options: [
          {
            id: 'a',
            text: 'BM25 scores are unbounded positive numbers dependent on query length and corpus statistics, while cosine similarities are bounded between 0 and 1, making direct addition sensitive to outliers.',
            isCorrect: true,
            rationale: 'Correct! The disparate scales and distributions make linear score combination unpredictable across different queries and changing corpora.',
          },
          {
            id: 'b',
            text: 'Dense vectors cannot be queried concurrently with sparse indices.',
            isCorrect: false,
            rationale: 'Hybrid search systems routinely query both indices concurrently.',
          },
          {
            id: 'c',
            text: 'BM25 scores are strictly negative integers.',
            isCorrect: false,
            rationale: 'BM25 scores are non-negative real numbers.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'How does Reciprocal Rank Fusion (RRF) combine candidate lists from disparate search engines?',
        options: [
          {
            id: 'a',
            text: 'By accumulating reciprocal rank scores 1 / (k + rank) based purely on ordinal rank positions across engines, favoring documents that achieve consensus across multiple retrieval modalities.',
            isCorrect: true,
            rationale: 'Correct! RRF relies on ordinal rank order rather than fragile raw score magnitudes, rewarding multi-list consensus.',
          },
          {
            id: 'b',
            text: 'By averaging the raw floating-point similarity values returned by each engine.',
            isCorrect: false,
            rationale: 'RRF intentionally discards raw scores to prevent scale distortion.',
          },
          {
            id: 'c',
            text: 'By discarding all documents that appear in only one search engine.',
            isCorrect: false,
            rationale: 'Documents appearing in a single engine are still scored; they simply receive lower reciprocal rank contributions.',
          },
        ],
      },
    ],
  },
  'quiz-6-3': {
    id: 'quiz-6-3',
    title: 'Check Your Understanding: Cross-Encoder Re-Ranking',
    questions: [
      {
        id: 'q1',
        prompt: 'What architectural difference gives cross-encoders superior precision over bi-encoders for relevance scoring?',
        options: [
          {
            id: 'a',
            text: 'Cross-encoders process the query and candidate document together in a single sequence, enabling full all-to-all cross-attention between every query token and document token.',
            isCorrect: true,
            rationale: 'Correct! Joint cross-attention allows query terms to dynamically attend to document qualifiers, conditions, and negations.',
          },
          {
            id: 'b',
            text: 'Cross-encoders compress passages into smaller 64-dimensional vectors.',
            isCorrect: false,
            rationale: 'Cross-encoders do not produce standalone document vectors; they output a scalar relevance logit.',
          },
          {
            id: 'c',
            text: 'Cross-encoders bypass neural network computation in favor of regex string matching.',
            isCorrect: false,
            rationale: 'Cross-encoders are full transformer neural networks.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'Why are cross-encoders typically deployed in a two-stage funnel (re-ranking top candidates) rather than scoring the entire corpus directly?',
        options: [
          {
            id: 'a',
            text: 'Running cross-attention forward passes across millions of documents at query time is computationally prohibitive, whereas scoring a pre-filtered top-50 pool adds minimal latency.',
            isCorrect: true,
            rationale: 'Correct! Bi-encoders filter millions of vectors in milliseconds; cross-encoders then apply precise, compute-heavy scoring to only the top candidate pool.',
          },
          {
            id: 'b',
            text: 'Cross-encoders cannot score more than 10 documents per hour.',
            isCorrect: false,
            rationale: 'Modern cross-encoders score dozens of candidate pairs in tens of milliseconds on standard hardware.',
          },
          {
            id: 'c',
            text: 'Cross-encoders only function when preceded by BM25.',
            isCorrect: false,
            rationale: 'Cross-encoders can re-rank candidates from dense, sparse, or hybrid first-stage retrievers.',
          },
        ],
      },
    ],
  },
  'quiz-7-1': {
    id: 'quiz-7-1',
    title: 'Check Your Understanding: Interpreting Similarity Heatmaps',
    questions: [
      {
        id: 'q1',
        prompt: 'In a pairwise chunk similarity matrix, what does a distinct block-diagonal cluster of high cosine similarity signify?',
        options: [
          {
            id: 'a',
            text: 'A cohesive sequence of adjacent chunks that explore the same topical subject before a transition boundary occurs.',
            isCorrect: true,
            rationale: 'Correct! Block diagonals reflect sustained topical coherence across sequential passages.',
          },
          {
            id: 'b',
            text: 'A corruption in the character encoding of the document.',
            isCorrect: false,
            rationale: 'Block diagonal clusters are an indicator of natural topic structure, not data corruption.',
          },
          {
            id: 'c',
            text: 'Hardware faults in the underlying vector index.',
            isCorrect: false,
            rationale: 'Heatmaps reflect vector mathematics, not hardware stability.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What issue is indicated when cells far away from the main diagonal display high cosine similarity (>0.80)?',
        options: [
          {
            id: 'a',
            text: 'Cross-document redundancy or repeated boilerplate (such as legal notices, navigation headers, or duplicate sections) appearing across distant parts of the text.',
            isCorrect: true,
            rationale: 'Correct! High off-diagonal values expose repetitive boilerplate or duplicated passages that should be deduplicated.',
          },
          {
            id: 'b',
            text: 'The document is written entirely in valid Python syntax.',
            isCorrect: false,
            rationale: 'Programming syntax does not cause off-diagonal cosine spikes in general prose.',
          },
          {
            id: 'c',
            text: 'High semantic diversity across every paragraph.',
            isCorrect: false,
            rationale: 'High off-diagonal values reflect repetition, which is the opposite of diversity.',
          },
        ],
      },
    ],
  },
  'quiz-7-2': {
    id: 'quiz-7-2',
    title: 'Check Your Understanding: Spotting Bloat & Orphan Chunks',
    questions: [
      {
        id: 'q1',
        prompt: 'Why do tiny "orphan chunks" (e.g. 5–15 tokens) degrade retrieval quality in production RAG systems?',
        options: [
          {
            id: 'a',
            text: 'They lack surrounding context to anchor their semantic embeddings, leading to noisy false-positive matches that consume top-k prompt slots with uninformative fragments.',
            isCorrect: true,
            rationale: 'Correct! Without context, micro-fragments produce noisy vector embeddings that hijack prompt space.',
          },
          {
            id: 'b',
            text: 'Vector databases reject chunks containing fewer than 50 tokens.',
            isCorrect: false,
            rationale: 'Vector databases accept vectors of any length; the issue is semantic quality, not database constraints.',
          },
          {
            id: 'c',
            text: 'Small chunks cause the LLM generation process to abort.',
            isCorrect: false,
            rationale: 'LLMs can process short passages, but receive insufficient evidence to construct meaningful answers.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'How does Maximal Marginal Relevance (MMR) address the issue of semantic bloat during retrieval?',
        options: [
          {
            id: 'a',
            text: 'It balances query relevance with novelty, explicitly penalizing candidate chunks that share high similarity with already-selected passages in the prompt.',
            isCorrect: true,
            rationale: 'Correct! MMR optimizes for diversity, preventing redundant chunks from crowding out unique factual perspectives.',
          },
          {
            id: 'b',
            text: 'It rewrites the document text using a summarization model.',
            isCorrect: false,
            rationale: 'MMR is a mathematical ranking criterion, not a text generation model.',
          },
          {
            id: 'c',
            text: 'It deletes duplicate source files from the physical storage volume.',
            isCorrect: false,
            rationale: 'MMR operates dynamically during retrieval; it does not alter file storage.',
          },
        ],
      },
    ],
  },
  'quiz-7-3': {
    id: 'quiz-7-3',
    title: 'Check Your Understanding: Measuring Chunk Utilization & Token Waste',
    questions: [
      {
        id: 'q1',
        prompt: 'How is the Chunk Utilization Rate defined in production evaluation frameworks?',
        options: [
          {
            id: 'a',
            text: 'The percentage of retrieved prompt context tokens that directly support or are cited in the model synthesized answer.',
            isCorrect: true,
            rationale: 'Correct! Chunk utilization measures what fraction of injected context tokens was actively used to formulate the answer.',
          },
          {
            id: 'b',
            text: 'The total storage size of the vector database divided by the document count.',
            isCorrect: false,
            rationale: 'Storage size per document measures index storage efficiency, not context utilization.',
          },
          {
            id: 'c',
            text: 'The speed in milliseconds at which the embedding model converts text into vectors.',
            isCorrect: false,
            rationale: 'Embedding generation speed is an ingestion latency metric.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary operational consequence of maintaining a low chunk utilization rate (e.g. under 15%)?',
        options: [
          {
            id: 'a',
            text: 'High token waste costs, elevated prefill latency, and increased risk of attention dilution where critical evidence is lost among irrelevant context.',
            isCorrect: true,
            rationale: 'Correct! Padded prompts waste budget on ignored tokens and trigger the "Lost in the Middle" attention degradation effect.',
          },
          {
            id: 'b',
            text: 'Inability to execute cosine similarity calculations.',
            isCorrect: false,
            rationale: 'Cosine similarity is computed during retrieval, independent of prompt utilization.',
          },
          {
            id: 'c',
            text: 'Immediate failure of all API rate limits.',
            isCorrect: false,
            rationale: 'Rate limits depend on call frequency and total token quotas, not prompt utilization ratios.',
          },
        ],
      },
    ],
  },
  'quiz-8-1': {
    id: 'quiz-8-1',
    title: 'Check Your Understanding: Legal Contracts & Regulatory Compliance',
    questions: [
      {
        id: 'q1',
        prompt: 'Why is arbitrary character chunking hazardous when applied to legal contracts?',
        options: [
          {
            id: 'a',
            text: 'It severs numbered clause headers and isolates restrictive exceptions (such as "Provided that...") from the covenants they govern, altering the legal interpretation.',
            isCorrect: true,
            rationale: 'Correct! Severing qualifying clauses or section numbers strips essential context, leading to inaccurate legal conclusions.',
          },
          {
            id: 'b',
            text: 'Legal documents cannot be processed by transformer tokenizers.',
            isCorrect: false,
            rationale: 'Transformer tokenizers process legal vocabulary without issue.',
          },
          {
            id: 'c',
            text: 'Section titles in legal contracts are prohibited from being indexed.',
            isCorrect: false,
            rationale: 'There is no prohibition against indexing legal section titles.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What is the primary benefit of prepending hierarchical breadcrumbs (e.g. [Doc > Article IV > Section 4.2]) to legal chunks?',
        options: [
          {
            id: 'a',
            text: 'It grounds each clause in its governing structural hierarchy, allowing embeddings to capture jurisdictional scope and enabling precise citations.',
            isCorrect: true,
            rationale: 'Correct! Breadcrumbs ensure the embedding model and the downstream LLM know the exact article and section governing each clause.',
          },
          {
            id: 'b',
            text: 'It replaces the need to store the actual clause text in the database.',
            isCorrect: false,
            rationale: 'The clause text must still be stored and retrieved to answer user queries.',
          },
          {
            id: 'c',
            text: 'It compresses the token count of the contract by 50%.',
            isCorrect: false,
            rationale: 'Breadcrumbs add a small number of tokens (20–30) to preserve context, rather than compressing the text.',
          },
        ],
      },
    ],
  },
  'quiz-8-2': {
    id: 'quiz-8-2',
    title: 'Check Your Understanding: Technical Docs & API References',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the primary failure mode of flat character splitting on technical documentation and API references?',
        options: [
          {
            id: 'a',
            text: 'It severs executable code snippets from the HTTP endpoint descriptions and parameter schemas that explain them, leading to hallucinated API parameters.',
            isCorrect: true,
            rationale: 'Correct! Splitting code from endpoint routes leaves the code snippet ambiguous, causing the model to guess endpoints or payload parameters.',
          },
          {
            id: 'b',
            text: 'It converts code snippets into binary executable files.',
            isCorrect: false,
            rationale: 'Text splitters do not compile code into binary files.',
          },
          {
            id: 'c',
            text: 'It prevents markdown viewers from rendering bold text.',
            isCorrect: false,
            rationale: 'Rendering bold text is a frontend markdown styling concern, not a retrieval failure mode.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'How does Markdown AST-aware chunking protect the integrity of developer guides?',
        options: [
          {
            id: 'a',
            text: 'It respects document hierarchy by keeping endpoints, parameter tables, and fenced code blocks unified as atomic sections whenever token budgets permit.',
            isCorrect: true,
            rationale: 'Correct! By treating headings, tables, and code fences as structural units, AST-aware splitting prevents fragmented endpoints.',
          },
          {
            id: 'b',
            text: 'It automatically executes code blocks in a sandbox to verify compiler output.',
            isCorrect: false,
            rationale: 'Chunking partitions text for search; it does not execute code in a compiler sandbox.',
          },
          {
            id: 'c',
            text: 'It strips all non-alphanumeric characters from API routes.',
            isCorrect: false,
            rationale: 'API routes require slashes, colons, and hyphens to remain functional.',
          },
        ],
      },
    ],
  },
  'quiz-8-3': {
    id: 'quiz-8-3',
    title: 'Check Your Understanding: Financial Filings & Balance Sheets',
    questions: [
      {
        id: 'q1',
        prompt: 'When chunking a multi-year comparative financial balance sheet, why must column headers be repeated across every chunk slice?',
        options: [
          {
            id: 'a',
            text: 'Numerical values (such as $18,200) lose their reporting periods (e.g. 2024 vs 2023) and currency denominations (e.g. in millions) if severed from header rows.',
            isCorrect: true,
            rationale: 'Correct! Numbers in financial statements are unanchored without the reporting year and denomination specified in the table header.',
          },
          {
            id: 'b',
            text: 'Financial tables must contain an equal number of rows and columns.',
            isCorrect: false,
            rationale: 'Financial tables frequently have many more rows than columns.',
          },
          {
            id: 'c',
            text: 'SEC regulations mandate that chunks cannot exceed 50 characters.',
            isCorrect: false,
            rationale: 'SEC regulations govern regulatory reporting, not internal RAG chunk sizes.',
          },
        ],
      },
      {
        id: 'q2',
        prompt: 'What advantage does tabular row linearization (converting table rows into semantic sentences) offer for financial search?',
        options: [
          {
            id: 'a',
            text: 'It creates dense, natural language representations that directly match conversational user queries (e.g. "What was operating income in 2024?").',
            isCorrect: true,
            rationale: 'Correct! Dense embedding models align more naturally with linear semantic sentences than with raw ASCII pipe tables.',
          },
          {
            id: 'b',
            text: 'It reduces the total token count of the financial filing by 80%.',
            isCorrect: false,
            rationale: 'Linearization generally increases token count slightly to add explanatory words.',
          },
          {
            id: 'c',
            text: 'It eliminates the requirement to perform vector indexing.',
            isCorrect: false,
            rationale: 'Linearized sentences are still embedded and indexed in vector databases.',
          },
        ],
      },
    ],
  },
};
