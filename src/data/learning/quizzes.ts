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
};
