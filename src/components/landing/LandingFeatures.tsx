import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  ArrowRight,
  Check,
  SplitSquareVertical,
  Activity,
  Code2,
  FileText,
  Sparkles,
  Table,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface LandingFeaturesProps {
  onLaunchApp: (sampleId?: string) => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ onLaunchApp }) => {
  const [selectedSplitter, setSelectedSplitter] = useState<'recursive' | 'character' | 'token' | 'markdown' | 'tabular'>('recursive');
  const [selectedModel, setSelectedModel] = useState<'cl100k' | 'o200k'>('cl100k');

  const splitterDetails = {
    recursive: {
      title: 'Recursive Character Splitter',
      bestFor: 'General documentation, articles, and mixed prose',
      delimiters: '["\\n\\n", "\\n", " ", ""]',
      description:
        'Recursively traverses an array of delimiters from highest structural hierarchy (double newline for paragraphs) down to single characters. Keeps related thoughts grouped together until forced to partition by size.',
      sampleOutput: [
        { id: 1, title: 'Chunk #1 · ~245 tok', text: '### 1. Vector Database Architectures\nModern RAG applications depend heavily on high-throughput vector indexes such as HNSW or IVF-PQ...' },
        { id: 2, title: 'Chunk #2 · ~280 tok', text: 'When queries are executed against the index, cosine similarity or dot product metrics calculate the closest match across the embedding space...' },
        { id: 3, title: 'Chunk #3 · ~210 tok', text: 'Careful tuning of chunk overlap ensures that facts spanning across boundaries are not severed during retrieval...' },
      ],
    },
    character: {
      title: 'Fixed Character Splitter',
      bestFor: 'Raw unformatted text feeds or fixed-size legacy ingest buffers',
      delimiters: 'Fixed step size (e.g. 1,000 characters)',
      description:
        'Slices text at uniform character offsets regardless of natural linguistic boundaries. Simple and fast, but frequently splits words and clauses mid-sentence.',
      sampleOutput: [
        { id: 1, title: 'Chunk #1 · ~195 tok', text: '### 1. Vector Database Architectures\nModern RAG applications depend heavily on high-throughput vector indexes such as HNSW or IVF-PQ. When queries are executed' },
        { id: 2, title: 'Chunk #2 · ~205 tok', text: 'against the index, cosine similarity or dot product metrics calculate the closest match across the embedding space. Careful tuning of chunk overlap ensures' },
        { id: 3, title: 'Chunk #3 · ~190 tok', text: 'that facts spanning across boundaries are not severed during retrieval...' },
      ],
    },
    token: {
      title: 'Exact BPE Token Splitter',
      bestFor: 'Hard model context limits and exact embedding API cost planning',
      delimiters: 'Byte-Pair Encoding tokens (cl100k_base, o200k_base)',
      description:
        'Measures tokens directly using client-side WebAssembly TikToken BPE encoders. Guarantees that no chunk will exceed your LLM embedding model limit.',
      sampleOutput: [
        { id: 1, title: 'Chunk #1 · 256 tok (Exact)', text: '### 1. Vector Database Architectures\nModern RAG applications depend heavily on high-throughput vector indexes such as HNSW...' },
        { id: 2, title: 'Chunk #2 · 256 tok (Exact)', text: 'When queries are executed against the index, cosine similarity or dot product metrics calculate the closest match...' },
        { id: 3, title: 'Chunk #3 · 142 tok (Remainder)', text: 'Careful tuning of chunk overlap ensures that facts spanning across boundaries are not severed during retrieval...' },
      ],
    },
    markdown: {
      title: 'Markdown & Heading Splitter',
      bestFor: 'Technical documentation, READMEs, API references, and knowledge bases',
      delimiters: '["# ", "## ", "### ", "```", "\\n\\n"]',
      description:
        'Aware of Markdown syntax trees. Preserves table rows, prevents breaking inside code fences, and keeps sections under their relevant header tags.',
      sampleOutput: [
        { id: 1, title: 'Chunk #1 · ~260 tok', text: '### 1. Vector Database Architectures\nModern RAG applications depend heavily on high-throughput vector indexes such as HNSW or IVF-PQ...' },
        { id: 2, title: 'Chunk #2 · ~315 tok', text: '```python\n# Vector Store Ingestion\nresults = store.similarity_search(query, k=4)\n```\nWhen queries are executed against the index...' },
        { id: 3, title: 'Chunk #3 · ~185 tok', text: '### 2. Overlap Strategies\nCareful tuning of chunk overlap ensures that facts spanning across boundaries are not severed...' },
      ],
    },
    tabular: {
      title: 'Tabular & CSV Splitter',
      bestFor: 'CSV, TSV, product catalogs, and tabular database dumps',
      delimiters: 'Row boundaries with preserved column headers',
      description:
        'Slices tabular data row-by-row while automatically repeating the CSV/TSV header row across every chunk so downstream models retain schema context.',
      sampleOutput: [
        { id: 1, title: 'Chunk #1 · Rows 1–25', text: 'id,name,role,department\n101,Alice,ML Engineer,AI Platform\n102,Bob,Data Scientist,Analytics...' },
        { id: 2, title: 'Chunk #2 · Rows 26–50', text: 'id,name,role,department\n126,Carol,Backend Dev,Infrastructure\n127,Dave,Frontend Dev,Product...' },
      ],
    },
  };

  const modelTokenBreakdowns = {
    cl100k: {
      name: 'cl100k_base (Exact: GPT-4, text-embedding-3)',
      tokenCount: 7,
      tokens: ['def', ' authenticate', '_user', '(token', ':', ' str', ') -> bool:'],
    },
    o200k: {
      name: 'o200k_base (Exact: GPT-4o)',
      tokenCount: 5,
      tokens: ['def authenticate', '_user(', 'token:', ' str) ->', ' bool:'],
    },
  };

  const activeData = splitterDetails[selectedSplitter];
  const activeModelData = modelTokenBreakdowns[selectedModel];

  return (
    <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-control bg-accent-subtle text-accent text-2xs font-mono font-semibold mb-3 border border-accent/25">
          <Cpu className="h-3 w-3" />
          <span>Core Splitting Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-4 title-tracking">
          Five Purpose-Built Strategies. Zero Guesswork.
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
          Different documents require distinct partitioning algorithms. ChunkLens executes your exact production pipeline client-side so you can observe how text flows before saving to vector stores.
        </p>
      </div>

      {/* Splitter Interactive Switcher */}
      <div className="mb-16">
        {/* Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'recursive', label: 'Recursive Character', icon: <Layers className="h-3.5 w-3.5" /> },
            { id: 'character', label: 'Fixed Character', icon: <FileText className="h-3.5 w-3.5" /> },
            { id: 'token', label: 'Exact BPE Tokenizer', icon: <Cpu className="h-3.5 w-3.5" /> },
            { id: 'markdown', label: 'Markdown & Heading', icon: <Code2 className="h-3.5 w-3.5" /> },
            { id: 'tabular', label: 'Tabular & CSV', icon: <Table className="h-3.5 w-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSplitter(tab.id as typeof selectedSplitter)}
              className={cn(
                'px-4 py-2 rounded-control text-xs font-medium transition-all flex items-center space-x-2 focus-ring card-interactive',
                selectedSplitter === tab.id
                  ? 'bg-accent text-white shadow-card font-semibold'
                  : 'bg-surface-1 text-text-secondary hover:text-text hover:bg-surface-2 border border-separator'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Selected Splitter Showcase Card */}
        <div className="rounded-card border border-separator bg-surface-1 shadow-card p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Algorithm Specs */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <span className="text-2xs font-mono text-accent font-semibold">Active Strategy</span>
                <h3 className="text-xl font-bold text-text mt-0.5">{activeData.title}</h3>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {activeData.description}
              </p>

              <div className="space-y-3 pt-3 border-t border-separator text-xs">
                <div>
                  <span className="text-text-tertiary font-mono text-2xs block mb-1">Recommended For:</span>
                  <span className="text-text font-medium">{activeData.bestFor}</span>
                </div>
                <div>
                  <span className="text-text-tertiary font-mono text-2xs block mb-1">Delimiters / Logic:</span>
                  <code
                    tabIndex={0}
                    role="region"
                    aria-label="Splitter delimiters"
                    className="text-2xs font-mono bg-surface-2 px-2 py-1 rounded-control border border-separator text-text-secondary block overflow-x-auto focus-ring"
                  >
                    {activeData.delimiters}
                  </code>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onLaunchApp()}
                  icon={<ArrowRight className="h-3.5 w-3.5" />}
                  className="w-full sm:w-auto text-xs font-semibold"
                >
                  <span>Test {activeData.title}</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Simulated Chunks Output */}
            <div className="lg:col-span-7 bg-surface-2/40 rounded-panel border border-separator p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between text-2xs font-mono text-text-tertiary pb-2 border-b border-separator">
                <span>Illustration: Sample Partitions</span>
                <span>Structural Preview</span>
              </div>

              {activeData.sampleOutput.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-3 rounded-control bg-surface-1 border border-separator shadow-subtle hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5 text-2xs font-mono">
                    <span className="font-semibold text-text">{chunk.title}</span>
                    <span className="px-1.5 py-0.5 rounded-control bg-surface-2 text-text-secondary border border-separator">
                      Illustration
                    </span>
                  </div>
                  <p dir="auto" className="text-xs text-text-secondary font-mono leading-relaxed line-clamp-2">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE BPE TOKENIZER VARIANCE INSPECTOR (ILLUSTRATION) */}
      <div className="mb-16 p-6 sm:p-8 rounded-card border border-separator bg-surface-1 shadow-subtle">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-separator">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
              <Sparkles className="h-3 w-3" />
              <span>Token Inspector (Illustration)</span>
            </div>
            <h3 className="text-xl font-bold text-text">OpenAI BPE Tokenizer Variance</h3>
            <p className="text-xs text-text-secondary mt-1">
              Exact token counts computed client-side via TikToken (o200k_base, cl100k_base). Non-OpenAI models are calibrated estimates.
            </p>
          </div>

          {/* Model Switcher Pills */}
          <div className="flex items-center space-x-1.5 bg-surface-2 p-1 rounded-control border border-separator text-xs font-mono">
            {[
              { id: 'cl100k', label: 'cl100k_base' },
              { id: 'o200k', label: 'o200k_base' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id as typeof selectedModel)}
                className={cn(
                  'px-2.5 py-1 rounded font-medium transition-all active-press',
                  selectedModel === m.id
                    ? 'bg-accent text-white shadow-subtle font-semibold'
                    : 'text-text-secondary hover:text-text'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-control bg-surface-2 border border-separator space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between text-2xs text-text-tertiary">
            <span>Model: <strong className="text-text">{activeModelData.name}</strong></span>
            <span>Token Count: <strong className="text-accent">{activeModelData.tokenCount} tokens</strong></span>
          </div>

          {/* Token Visualizer Chips */}
          <div className="flex flex-wrap gap-1.5 p-3 rounded bg-surface-1 border border-separator">
            {activeModelData.tokens.map((tok, i) => (
              <span
                key={i}
                className={cn(
                  'px-2 py-1 rounded text-2xs font-mono font-medium border select-none',
                  i % 2 === 0
                    ? 'bg-accent-subtle text-accent border-accent/25'
                    : 'bg-surface-2 text-text border-separator'
                )}
              >
                {tok}
              </span>
            ))}
          </div>

          <div className="text-2xs text-text-secondary font-sans leading-relaxed">
            Character counts lie: a fixed 1,000 character limit creates wide token swings depending on punctuation, code syntax, and vocabulary compression. ChunkLens tokenizes client-side using real BPE tables.
          </div>
        </div>
      </div>

      {/* Continuity & Redundancy Mechanics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle card-interactive">
          <div className="h-10 w-10 rounded-control bg-accent-subtle border border-accent/25 flex items-center justify-center text-accent mb-4">
            <Activity className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">Lexical Continuity Scoring</h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            ChunkLens calculates consecutive partition similarity using lexical TF-IDF cosine metrics to measure topic transition across chunk boundaries.
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label="Continuity formula"
            className="p-3 rounded-control bg-surface-2 border border-separator font-mono text-2xs text-text-secondary mb-4 overflow-x-auto focus-ring"
          >
            Continuity(Chunk A, Chunk B) = CosineSim(TF-IDF(A), TF-IDF(B))
          </div>
          <ul className="space-y-2 text-xs text-text-secondary">
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-status-success-text shrink-0 mt-0.5" />
              <span><strong>Adjacent Term Overlap:</strong> Inspect shared vocabulary between chunk N and chunk N+1.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-status-success-text shrink-0 mt-0.5" />
              <span><strong>Vocabulary Shifting:</strong> Spot where sections shift topics or sever natural paragraphs.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle card-interactive">
          <div className="h-10 w-10 rounded-control bg-status-warn-subtle border border-status-warn/25 flex items-center justify-center text-status-warn-text mb-4">
            <SplitSquareVertical className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">Overlap Redundancy Analysis</h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            Large chunk overlaps create redundant tokens that duplicate information and waste vector database storage.
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label="Overlap ratio formula"
            className="p-3 rounded-control bg-surface-2 border border-separator font-mono text-2xs text-text-secondary mb-4 overflow-x-auto focus-ring"
          >
            Overlap Ratio = OverlapTokens / TargetChunkTokens
          </div>
          <ul className="space-y-2 text-xs text-text-secondary">
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-status-success-text shrink-0 mt-0.5" />
              <span><strong>Heatmap Inspection:</strong> Interactive N x N lexical similarity matrix across all chunks.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="h-3.5 w-3.5 text-status-success-text shrink-0 mt-0.5" />
              <span><strong>Cost Tuning:</strong> Find the minimum overlap required to maintain context without bloat.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 rounded-card border border-separator bg-surface-2/40 text-center">
        <h3 className="text-xl font-bold text-text mb-2">Ready to inspect your documents?</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto mb-6">
          Load your text, pick a splitting strategy, and inspect chunk boundaries instantly in your browser.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => onLaunchApp()}
          icon={<ArrowRight className="h-4 w-4" />}
          className="text-xs font-semibold px-6 shadow-card"
        >
          <span>Open ChunkLens Visualizer</span>
        </Button>
      </div>
    </div>
  );
};
