import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Check,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  Cpu,
  Calculator,
  Shield,
  Briefcase,
  BookOpen,
  Grid3X3,
  Layers,
  AlertTriangle,
  FileCheck,
  Terminal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface LandingOverviewProps {
  onLaunchApp: (sampleId?: string) => void;
  onOpenEarlyAccess: (tierName: string) => void;
  onNavigatePage: (page: string) => void;
}

const MINI_SAMPLES: Record<
  string,
  { label: string; tag: string; sampleId: string; text: string; blindSplits: string[] }
> = {
  legal: {
    label: 'Legal Master Agreement',
    tag: 'Contract Clause',
    sampleId: 'legal-saas-agreement',
    text: `1. INDEMNIFICATION AND WARRANTIES. Provider shall defend, indemnify, and hold harmless Customer from and against any third-party claims alleging that the Subscription Services infringe any valid patent or copyright.

2. LIMITATION OF LIABILITY. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF THIS AGREEMENT.

3. GOVERNING LAW AND DISPUTE RESOLUTION. This Agreement shall be governed by the laws of the State of Delaware, without regard to conflict of laws principles.`,
    blindSplits: [
      `1. INDEMNIFICATION AND WARRANTIES. Provider shall defend, indemnify, and hold harmless Customer from and against any third-party claims alleging that the Subscription Services in`,
      `fringe any valid patent or copyright.\n\n2. LIMITATION OF LIABILITY. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAM`,
      `AGES ARISING OUT OF THIS AGREEMENT.\n\n3. GOVERNING LAW AND DISPUTE RESOLUTION. This Agreement shall be governed by the laws of the State of Delaware, without regard to con`,
    ],
  },
  financial: {
    label: 'Financial Performance 10-Q',
    tag: 'Financial Disclosure',
    sampleId: 'financial-10k-q3',
    text: `Operating Income for Q3 reached $14.2M, representing a 28% year-over-year increase compared to $11.1M in Q3 of the prior fiscal year.

Gross Margin expanded by 180 basis points to 74.2%, driven by enterprise customer expansion and automated infrastructure efficiencies.

Free Cash Flow generated during the nine months ended September 30 was $38.6M, compared to $22.4M for the same period last year.`,
    blindSplits: [
      `Operating Income for Q3 reached $14.2M, representing a 28% year-over-year increase compared to $11.1M in Q3 of the prior fiscal year.\n\nGross Margin expanded by 180 basis points to 74`,
      `.2%, driven by enterprise customer expansion and automated infrastructure efficiencies.\n\nFree Cash Flow generated during the nine months ended September 30 was $38.6M, comp`,
      `ared to $22.4M for the same period last year.`,
    ],
  },
  code: {
    label: 'Python Vector Search Service',
    tag: 'FastAPI + LangChain',
    sampleId: 'python-backend-service',
    text: `from fastapi import FastAPI, HTTPException
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

app = FastAPI(title="Semantic Retrieval API")
vector_store = Chroma(collection_name="docs", embedding_function=OpenAIEmbeddings())

@app.post("/query")
async def retrieve_context(query: str, top_k: int = 4):
    results = vector_store.similarity_search_with_score(query, k=top_k)
    return [{"chunk": doc.page_content, "score": score} for doc, score in results]`,
    blindSplits: [
      `from fastapi import FastAPI, HTTPException\nfrom langchain_chroma import Chroma\nfrom langchain_openai import OpenAIEmbeddings\n\napp = FastAPI(title="Semantic Retrieval API")\nvector_store = Chroma(coll`,
      `ection_name="docs", embedding_function=OpenAIEmbeddings())\n\n@app.post("/query")\nasync def retrieve_context(query: str, top_k: int = 4):\n    results = vector_store.similarity_search_with_score(query, k=top_k)\n    return [{"ch`,
      `unk": doc.page_content, "score": score} for doc, score in results]`,
    ],
  },
};

export const LandingOverview: React.FC<LandingOverviewProps> = ({
  onLaunchApp,
  onOpenEarlyAccess,
  onNavigatePage,
}) => {
  // Interactive Mini-Chunker state
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('legal');
  const [miniChunkSize, setMiniChunkSize] = useState<number>(220);
  const [splitterMode, setSplitterMode] = useState<'semantic' | 'blind'>('semantic');
  const [hoveredChunkIdx, setHoveredChunkIdx] = useState<number | null>(null);

  // Interactive ROI Calculator state
  const [monthlyDocs, setMonthlyDocs] = useState<number>(2500);
  const [avgDocTokens, setAvgDocTokens] = useState<number>(10000);
  const [overlapPct, setOverlapPct] = useState<number>(20);

  // Interactive Mini Heatmap hover state
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; score: number } | null>(null);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const activeSample = MINI_SAMPLES[selectedSampleKey];

  // Calculate live chunks in Mini-Chunker
  const miniChunks = useMemo(() => {
    if (splitterMode === 'blind') {
      return activeSample.blindSplits.map((text, idx) => ({
        id: `blind-${idx + 1}`,
        text,
        approxTokens: Math.round(text.length / 4),
        continuity: idx === 0 ? 'Start' : '14.2%',
        isSevered: true,
      }));
    }

    const raw = activeSample.text;
    const paragraphs = raw.split('\n\n').filter((p) => p.trim().length > 0);
    const result: { id: string; text: string; approxTokens: number; continuity: string; isSevered: boolean }[] = [];

    let current = '';
    let idx = 1;

    paragraphs.forEach((p) => {
      if ((current + '\n\n' + p).length / 4 > miniChunkSize && current.length > 0) {
        result.push({
          id: `c-${idx++}`,
          text: current.trim(),
          approxTokens: Math.round(current.length / 4),
          continuity: idx === 2 ? '94.2%' : '88.5%',
          isSevered: false,
        });
        current = p;
      } else {
        current = current ? current + '\n\n' + p : p;
      }
    });

    if (current.trim().length > 0) {
      result.push({
        id: `c-${idx++}`,
        text: current.trim(),
        approxTokens: Math.round(current.length / 4),
        continuity: idx === 1 ? 'Start' : '91.0%',
        isSevered: false,
      });
    }

    return result;
  }, [selectedSampleKey, miniChunkSize, splitterMode, activeSample]);

  // Calculate ROI Token Savings
  const savingsData = useMemo(() => {
    const totalTokensPerMonth = monthlyDocs * avgDocTokens;
    const overlapTokensPerMonth = totalTokensPerMonth * (overlapPct / 100);
    const annualWastedTokens = overlapTokensPerMonth * 12;

    // Vector DB & Embedding blended storage cost (~$0.07 / 1M tokens annually)
    const annualWastedSpend = (annualWastedTokens / 1_000_000) * 0.07;
    const potentialAnnualSavings = annualWastedSpend * 0.42;

    return {
      totalTokensPerMonth,
      annualWastedTokens,
      annualWastedSpend,
      potentialAnnualSavings,
    };
  }, [monthlyDocs, avgDocTokens, overlapPct]);

  // Mini Heatmap 4x4 matrix values
  const miniHeatmapData = [
    [100, 42, 18, 6],
    [42, 100, 34, 12],
    [18, 34, 100, 28],
    [6, 12, 28, 100],
  ];

  return (
    <div className="flex flex-col font-sans">
      {/* 1. ASYMMETRIC EDITORIAL HERO (7:5 SPLIT) */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-separator">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (7 cols): Strict Typographic Hierarchy & Clear Value */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Architecture & Security Tag */}
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-control bg-surface-2 border border-separator text-xs font-mono mb-6 select-none">
                <span className="h-2 w-2 rounded-full bg-status-success inline-block" />
                <span className="font-semibold text-text">100% Client-Side · Zero Egress</span>
                <span className="text-separator">|</span>
                <span className="text-2xs text-text-tertiary font-mono">Air-Gapped Web Worker</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.035em] text-text leading-[1.08] mb-5">
                Stop Guessing Your RAG Chunks.
                <span className="text-text-secondary block font-medium text-xl sm:text-3xl lg:text-4xl mt-3 tracking-[-0.025em]">
                  Inspect Token Boundaries Before Vector Ingestion.
                </span>
              </h1>

              {/* Constrained Body Paragraph (60ch–65ch) */}
              <p className="text-sm sm:text-base text-text-secondary max-w-[62ch] mb-8 leading-[1.6] font-sans">
                Test recursive, markdown, and character splitters against live BPE encodings. Catch severed clauses, identify fractured tables, and prevent uncalibrated overlap spend before loading vector databases.
              </p>

              {/* Action Cluster */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-8">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onLaunchApp()}
                  icon={<ArrowRight className="h-4 w-4" />}
                  className="px-6 py-2.5 rounded-control text-sm font-semibold shadow-none"
                >
                  <span>Launch Visualizer</span>
                </Button>

                <button
                  type="button"
                  onClick={() => onLaunchApp('legal-saas-agreement')}
                  className="px-5 py-2.5 rounded-control text-sm font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors active-press focus-ring flex items-center justify-center space-x-2"
                >
                  <FileCheck className="h-4 w-4 text-accent" />
                  <span>Try with Legal Agreement</span>
                </button>
              </div>

              {/* Engineering Specs Strip (Monospace Metrics) */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-mono text-text-tertiary select-none pt-4 border-t border-separator/80 w-full">
                <span>0 network requests</span>
                <span className="text-separator">·</span>
                <span>5 TikToken BPE models</span>
                <span className="text-separator">·</span>
                <span>4 splitters</span>
                <span className="text-separator">·</span>
                <span>LangChain &amp; LlamaIndex code export</span>
              </div>
            </div>

            {/* Right Column (5 cols): Live Ingestion Telemetry Card (Proof of Craft) */}
            <div className="lg:col-span-5">
              <div className="rounded-card border border-separator bg-surface-1 overflow-hidden">
                {/* Console Window Header */}
                <div className="px-4 py-2.5 bg-surface-2/70 border-b border-separator flex items-center justify-between text-2xs font-mono">
                  <div className="flex items-center space-x-2 text-text-secondary">
                    <Terminal className="h-3.5 w-3.5 text-accent" />
                    <span>telemetry://ingestion-worker</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-1 border border-separator text-status-success-text font-semibold">
                    SANDBOX ACTIVE
                  </span>
                </div>

                {/* Telemetry Metrics Ledger */}
                <div className="p-4 sm:p-5 space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2 pb-4 border-b border-separator text-center">
                    <div className="p-2 rounded bg-surface-2/40 border border-separator/60">
                      <div className="text-2xs text-text-tertiary">Partitions</div>
                      <div className="text-sm font-bold text-text tabular-nums mt-0.5">67</div>
                    </div>
                    <div className="p-2 rounded bg-surface-2/40 border border-separator/60">
                      <div className="text-2xs text-text-tertiary">Document</div>
                      <div className="text-sm font-bold text-text tabular-nums mt-0.5">18.6k ch</div>
                    </div>
                    <div className="p-2 rounded bg-surface-2/40 border border-separator/60">
                      <div className="text-2xs text-text-tertiary">Est. Ingestion</div>
                      <div className="text-sm font-bold text-accent tabular-nums mt-0.5">$0.0004</div>
                    </div>
                  </div>

                  {/* Chunk Split Demonstration */}
                  <div className="space-y-2 text-2xs">
                    <div className="flex items-center justify-between text-text-tertiary">
                      <span>Partition #14 (Clause 2)</span>
                      <span className="text-text font-semibold tabular-nums">291 tok</span>
                    </div>
                    <div className="p-2.5 rounded bg-surface-2 border border-separator font-sans text-xs text-text-secondary leading-relaxed">
                      &quot;...IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES...&quot;
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded bg-status-success-subtle border border-status-success/25 font-mono text-2xs text-status-success-text">
                      <span>Boundary Continuity:</span>
                      <span className="font-bold tabular-nums">92.4% (Natural Flow)</span>
                    </div>

                    <div className="flex items-center justify-between text-text-tertiary pt-1">
                      <span>Partition #15 (Clause 3)</span>
                      <span className="text-text font-semibold tabular-nums">245 tok</span>
                    </div>
                    <div className="p-2.5 rounded bg-surface-2 border border-separator font-sans text-xs text-text-secondary leading-relaxed">
                      &quot;3. GOVERNING LAW AND DISPUTE RESOLUTION. This Agreement shall be governed by the laws of Delaware...&quot;
                    </div>
                  </div>

                  {/* Quick Code Hook */}
                  <div className="pt-2 border-t border-separator text-2xs text-text-tertiary flex items-center justify-between">
                    <span>Tokenizer: o200k_base (GPT-4o)</span>
                    <span className="text-text font-semibold">0 network egress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE SIMULATION WORKBENCH (PLAYGROUND) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-2/30 border-b border-separator">
        <div className="max-w-6xl mx-auto">
          {/* Header & Controls Cluster */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
                <Layers className="h-3 w-3" />
                <span>Real-Time Partition Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
                Live Document Chunking Simulation
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-[55ch]">
                Inspect semantic recursive boundaries versus character-blind cuts on identical text samples.
              </p>
            </div>

            {/* Splitter Mode Comparison Switcher */}
            <div className="flex items-center space-x-2 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center p-0.5 rounded-control bg-surface-1 border border-separator text-xs">
                <button
                  type="button"
                  onClick={() => setSplitterMode('semantic')}
                  className={cn(
                    'px-3 py-1 rounded-control font-medium transition-colors active-press flex items-center space-x-1.5',
                    splitterMode === 'semantic'
                      ? 'bg-accent text-white font-semibold'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Semantic Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSplitterMode('blind')}
                  className={cn(
                    'px-3 py-1 rounded-control font-medium transition-colors active-press flex items-center space-x-1.5',
                    splitterMode === 'blind'
                      ? 'bg-status-warn-subtle text-status-warn-text border border-status-warn/30 font-semibold'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Blind Split</span>
                </button>
              </div>

              {/* Sample Selector Pills */}
              <div className="hidden sm:flex items-center space-x-1 bg-surface-1 p-0.5 rounded-control border border-separator text-xs">
                {Object.entries(MINI_SAMPLES).map(([key, data]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSampleKey(key)}
                    className={cn(
                      'px-2.5 py-1 rounded-control font-medium transition-colors active-press',
                      selectedSampleKey === key
                        ? 'bg-surface-2 text-text font-semibold border border-separator'
                        : 'text-text-secondary hover:text-text'
                    )}
                  >
                    {data.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Playground Box */}
          <div className="rounded-card border border-separator bg-surface-1 p-5 sm:p-6">
            {/* Control Bar: Chunk Size Slider + Mode Indicator */}
            <div className="pb-4 mb-5 border-b border-separator flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center space-x-3 w-full sm:w-80">
                <span className="text-text-secondary shrink-0">Target Budget:</span>
                <input
                  type="range"
                  min="80"
                  max="450"
                  step="20"
                  value={miniChunkSize}
                  onChange={(e) => setMiniChunkSize(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                  aria-label="Target chunk budget slider"
                />
                <span className="text-accent font-bold tabular-nums min-w-[55px] text-right">
                  {miniChunkSize} tok
                </span>
              </div>

              {/* Status Readout */}
              <div className="flex items-center space-x-3 text-2xs">
                <span className="text-text-tertiary">
                  Partitions: <strong className="text-text font-semibold">{miniChunks.length} chunks</strong>
                </span>
                <span className="text-separator">|</span>
                <span className="text-text-tertiary">
                  Boundary Health:{' '}
                  <strong
                    className={cn(
                      'font-semibold',
                      splitterMode === 'semantic' ? 'text-status-success-text' : 'text-status-warn-text'
                    )}
                  >
                    {splitterMode === 'semantic' ? '94.2% (Smooth Flow)' : '14.2% (Severed Thought)'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Chunks Stream Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {miniChunks.map((chunk, idx) => {
                const isHovered = hoveredChunkIdx === idx;
                return (
                  <div
                    key={chunk.id}
                    onMouseEnter={() => setHoveredChunkIdx(idx)}
                    onMouseLeave={() => setHoveredChunkIdx(null)}
                    className={cn(
                      'p-4 rounded-control border transition-colors flex flex-col justify-between text-xs',
                      chunk.isSevered
                        ? 'border-status-warn/40 bg-status-warn-subtle/20'
                        : isHovered
                        ? 'border-accent bg-surface-2'
                        : 'border-separator bg-surface-2/40 hover:border-separator/90'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 text-2xs font-mono">
                        <span className="font-semibold text-text">Chunk #{idx + 1}</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded-control font-semibold tabular-nums',
                            chunk.isSevered
                              ? 'bg-status-warn-subtle text-status-warn-text border border-status-warn/25'
                              : 'bg-surface-2 text-text border border-separator'
                          )}
                        >
                          ~{chunk.approxTokens} tok
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary font-sans leading-relaxed line-clamp-3">
                        {chunk.text}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-separator/60 flex items-center justify-between text-2xs font-mono text-text-tertiary">
                      <span>Boundary: {chunk.isSevered ? 'Fractured' : 'Safe'}</span>
                      <span
                        className={cn(
                          'font-semibold',
                          chunk.isSevered ? 'text-status-warn-text' : 'text-status-success-text'
                        )}
                      >
                        {chunk.continuity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Playground Action Footer */}
            <div className="mt-6 pt-4 border-t border-separator flex items-center justify-between flex-wrap gap-3 text-xs">
              <span className="text-text-secondary text-2xs sm:text-xs">
                Inspect N x N cross-chunk similarity and exact token overlays in the Visualizer workspace.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onLaunchApp(activeSample.sampleId)}
                icon={<ArrowRight className="h-3.5 w-3.5" />}
                className="text-xs font-semibold"
              >
                <span>Launch in Full Workspace</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COST & OVERLAP AUDIT WORKBENCH (ROI CALCULATOR) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-separator">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
              <Calculator className="h-3.5 w-3.5" />
              <span>Token Waste Ledger</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-2">
              Calculate Your RAG Ingestion Waste
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-[60ch] leading-[1.6]">
              Estimate the annual storage and embedding overhead caused by uncalibrated chunk overlap percentages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Input Sliders (7 cols) */}
            <div className="lg:col-span-7 rounded-card border border-separator bg-surface-1 p-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Slider 1: Monthly Documents */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="roi-docs-slider" className="text-xs font-semibold text-text">
                      Documents Ingested Monthly
                    </label>
                    <span className="font-mono text-xs font-bold text-accent tabular-nums">
                      {monthlyDocs.toLocaleString()} docs
                    </span>
                  </div>
                  <input
                    id="roi-docs-slider"
                    type="range"
                    min="200"
                    max="20000"
                    step="200"
                    value={monthlyDocs}
                    onChange={(e) => setMonthlyDocs(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>200</span>
                    <span>10,000</span>
                    <span>20,000+</span>
                  </div>
                </div>

                {/* Slider 2: Average Doc Length */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="roi-tokens-slider" className="text-xs font-semibold text-text">
                      Avg. Document Length (Tokens)
                    </label>
                    <span className="font-mono text-xs font-bold text-accent tabular-nums">
                      {avgDocTokens.toLocaleString()} tok
                    </span>
                  </div>
                  <input
                    id="roi-tokens-slider"
                    type="range"
                    min="1000"
                    max="30000"
                    step="1000"
                    value={avgDocTokens}
                    onChange={(e) => setAvgDocTokens(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>1k tok</span>
                    <span>15k tok</span>
                    <span>30k tok</span>
                  </div>
                </div>

                {/* Slider 3: Blind Chunk Overlap */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="roi-overlap-slider" className="text-xs font-semibold text-text">
                      Unoptimized Blind Overlap
                    </label>
                    <span className="font-mono text-xs font-bold text-status-warn-text tabular-nums">
                      {overlapPct}% overlap
                    </span>
                  </div>
                  <input
                    id="roi-overlap-slider"
                    type="range"
                    min="10"
                    max="35"
                    step="5"
                    value={overlapPct}
                    onChange={(e) => setOverlapPct(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>10% (Tuned)</span>
                    <span>20% (Default)</span>
                    <span>35% (Severe Waste)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-separator text-2xs text-text-tertiary font-mono">
                Model: 1536-dimension dense vector store blended hosting and retrieval costs.
              </div>
            </div>

            {/* Live Calculation Output Card (5 cols) */}
            <div className="lg:col-span-5 rounded-card border border-separator bg-surface-1 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-separator mb-4">
                  <span className="text-xs font-mono text-text-secondary font-semibold">Annual Waste Breakdown</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-2 text-text border border-separator font-semibold">
                    Dynamic Model
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-2xs font-mono text-text-tertiary">Annual Redundant Overlap Tokens:</span>
                    <div className="text-xl font-bold font-mono text-status-warn-text tabular-nums mt-0.5">
                      {(savingsData.annualWastedTokens / 1_000_000).toFixed(1)}M tokens/yr
                    </div>
                  </div>

                  <div>
                    <span className="text-2xs font-mono text-text-tertiary">Estimated Annual Wasted Spend:</span>
                    <div className="text-2xl font-bold font-mono text-text tabular-nums mt-0.5">
                      ${savingsData.annualWastedSpend.toFixed(0)} <span className="text-xs font-normal text-text-tertiary">/ year</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-control bg-status-success-subtle border border-status-success/25">
                    <span className="text-2xs font-mono text-status-success-text font-semibold block mb-0.5">
                      Potential Annual Savings with ChunkLens:
                    </span>
                    <div className="text-2xl font-extrabold font-mono text-status-success-text tabular-nums">
                      ${savingsData.potentialAnnualSavings.toFixed(0)} / yr
                    </div>
                    <span className="text-2xs text-text-secondary block mt-1">
                      Calibrated down from {overlapPct}% overlap to measured boundary continuity.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onLaunchApp()}
                  className="w-full text-xs font-semibold"
                >
                  <span>Optimize Your Documents Free</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION: THREE FAILURES SOLVED + SEMANTIC HEATMAP */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-2/30 border-b border-separator">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono text-accent font-semibold">Ingestion Failure Modes</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mt-1 mb-2">
              Three Failures Solved by Visual Chunking
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-[60ch] leading-[1.6]">
              Downstream generation errors and context hallucinations trace directly to unseen boundaries at ingestion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-5 rounded-card border border-separator bg-surface-1 flex flex-col justify-between card-interactive">
              <div>
                <div className="h-9 w-9 rounded-control bg-status-warn-subtle border border-status-warn/25 flex items-center justify-center text-status-warn mb-4">
                  <SplitSquareVertical className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-text mb-2">Context Boundary Fractures</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Standard splitters sever sentences mid-thought or divide tables. Retrieved chunks lack qualifying clauses, causing hallucinated model responses.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Sequential continuity metrics preserve complete semantic thoughts.
              </div>
            </div>

            <div className="p-5 rounded-card border border-separator bg-surface-1 flex flex-col justify-between card-interactive">
              <div>
                <div className="h-9 w-9 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-accent mb-4">
                  <Calculator className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-text mb-2">Silent Token Bleed</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Default 20% overlaps across large corpora store millions of duplicate tokens, inflating recurring vector database costs without boosting accuracy.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Ingested vs document token metrics expose redundant duplication.
              </div>
            </div>

            <div className="p-5 rounded-card border border-separator bg-surface-1 flex flex-col justify-between card-interactive">
              <div>
                <div className="h-9 w-9 rounded-control bg-status-success-subtle border border-status-success/25 flex items-center justify-center text-status-success mb-4">
                  <Cpu className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-text mb-2">Character Count Mismatches</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Splitting by raw characters ignores Byte-Pair Encoding. 1,000 characters can swing from 180 to 450 tokens depending on formatting and code blocks.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Native TikToken BPE tokenizers compute true token lengths client-side.
              </div>
            </div>
          </div>

          {/* INTERACTIVE MINI SIMILARITY HEATMAP SPOTLIGHT */}
          <div className="p-6 rounded-card border border-separator bg-surface-1">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-4 border-b border-separator">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
                  <Grid3X3 className="h-3.5 w-3.5" />
                  <span>Semantic Overlap Matrix</span>
                </div>
                <h3 className="text-base font-bold text-text">Cross-Chunk Cosine Similarity</h3>
              </div>
              <div className="text-2xs font-mono text-text-tertiary">
                Hover any cell to inspect similarity between chunk pairs
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* 4x4 Grid (7 cols) */}
              <div className="md:col-span-7 flex justify-center">
                <div className="inline-block p-2 rounded-control bg-surface-2 border border-separator select-none">
                  {/* Column Headers */}
                  <div className="grid grid-cols-5 gap-1.5 mb-1.5 text-2xs font-mono text-text-tertiary text-center">
                    <span />
                    <span>#1</span>
                    <span>#2</span>
                    <span>#3</span>
                    <span>#4</span>
                  </div>

                  {miniHeatmapData.map((row, rIdx) => (
                    <div key={`row-${rIdx}`} className="grid grid-cols-5 gap-1.5 mb-1.5 items-center">
                      <span className="text-2xs font-mono text-text-tertiary text-center w-6">#{rIdx + 1}</span>
                      {row.map((score, cIdx) => {
                        const isSelf = rIdx === cIdx;
                        const isHovered = hoveredCell?.r === rIdx && hoveredCell?.c === cIdx;
                        return (
                          <button
                            key={`cell-${rIdx}-${cIdx}`}
                            type="button"
                            onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx, score })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={cn(
                              'h-9 w-9 sm:h-11 sm:w-11 rounded font-mono text-2xs flex items-center justify-center transition-colors focus-ring active-press',
                              isSelf
                                ? 'bg-accent text-white font-bold'
                                : score >= 40
                                ? 'bg-[var(--heat-high)] text-text font-semibold'
                                : score >= 20
                                ? 'bg-[var(--heat-mid)] text-text font-medium'
                                : 'bg-[var(--heat-low)] text-text-secondary border border-separator/50',
                              isHovered && 'ring-1 ring-accent'
                            )}
                          >
                            {score}%
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection Card (5 cols) */}
              <div className="md:col-span-5 p-4 rounded-control bg-surface-2 border border-separator text-xs space-y-3 font-mono">
                <div className="text-2xs text-text-tertiary border-b border-separator pb-1.5 font-semibold">
                  Cell Telemetry
                </div>
                {hoveredCell ? (
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-text">
                      Chunk #{hoveredCell.r + 1} &harr; Chunk #{hoveredCell.c + 1}
                    </div>
                    <div className="text-accent text-base font-extrabold tabular-nums">
                      {hoveredCell.score}% Semantic Overlap
                    </div>
                    <p className="text-2xs text-text-secondary font-sans leading-relaxed">
                      {hoveredCell.score === 100
                        ? 'Self similarity diagonal: exact 1.0 cosine identity.'
                        : hoveredCell.score >= 40
                        ? 'Moderate cross-chunk overlap. Context is preserved across the partition boundary.'
                        : 'Low similarity. Chunks discuss distinct sub-topics without redundant overlap.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xs text-text-tertiary font-sans leading-relaxed italic">
                    Hover over any cell in the 4x4 matrix to inspect cross-chunk cosine similarity in real time.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Deep-dive Navigation Links */}
          <div className="mt-10 pt-8 border-t border-separator/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigatePage('features')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring card-interactive"
            >
              <div className="flex items-center space-x-2.5">
                <Cpu className="h-4 w-4 text-accent" />
                <div>
                  <div className="font-semibold text-text group-hover:text-accent transition-colors">Splitter Engines</div>
                  <div className="text-2xs text-text-tertiary">4 splitters &amp; continuity math</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage('use-cases')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring card-interactive"
            >
              <div className="flex items-center space-x-2.5">
                <Briefcase className="h-4 w-4 text-accent" />
                <div>
                  <div className="font-semibold text-text group-hover:text-accent transition-colors">Industry Use Cases</div>
                  <div className="text-2xs text-text-tertiary">Legal, Finance, Code, Health</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage('security')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring card-interactive"
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="h-4 w-4 text-status-success-text" />
                <div>
                  <div className="font-semibold text-text group-hover:text-status-success-text transition-colors">Zero-Egress Security</div>
                  <div className="text-2xs text-text-tertiary">Web Worker air-gap proof</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-status-success-text transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage('docs')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring card-interactive"
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="h-4 w-4 text-accent" />
                <div>
                  <div className="font-semibold text-text group-hover:text-accent transition-colors">Docs &amp; Quickstart</div>
                  <div className="text-2xs text-text-tertiary">LangChain &amp; LlamaIndex snippets</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent transition-colors" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. PRICING & EARLY ACCESS TIERS (FROZEN) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-separator">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-16">
            <span className="text-xs font-mono text-accent font-semibold">Tiers &amp; Deployment</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mt-1 mb-2">
              Transparent, Developer-Friendly Tiers
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-[60ch] leading-[1.6]">
              The core single-document visualizer is free and open-source. Multi-document batch processing and team collaboration are scheduled for commercial release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TIER 1: Community (Active Now) */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-text-secondary">Community</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded bg-status-success-subtle text-status-success-text border border-status-success/25 font-semibold">
                    Available Now
                  </span>
                </div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$0</span>
                  <span className="text-xs text-text-tertiary font-mono">/ forever</span>
                </div>
                <p className="text-xs text-text-secondary mb-6 leading-[1.6]">
                  For individual AI engineers inspecting and tuning chunk strategies for single documents.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>All 4 Text Splitting Algorithms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Exact TikToken BPE Encoders (5 models)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Interactive N x N Similarity Heatmap</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Sequential Boundary Continuity Scoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Client-side zero-egress PDF parsing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Python &amp; TypeScript code exporters</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onLaunchApp()}
                className="w-full text-xs font-semibold"
              >
                <span>Launch Visualizer</span>
              </Button>
            </div>

            {/* TIER 2: Pro Developer (Frozen / Early Access) */}
            <div className="p-6 rounded-card border-2 border-accent bg-surface-1 flex flex-col justify-between relative card-interactive">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded bg-accent text-white font-mono text-2xs font-semibold">
                In Development · Priority Waitlist
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 mt-1">
                  <span className="text-xs font-mono font-semibold text-text">Pro Developer</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-2 text-text border border-separator font-semibold">
                    Target Q1 2027
                  </span>
                </div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$29</span>
                  <span className="text-xs text-text-tertiary font-mono">/ month</span>
                </div>
                <p className="text-xs text-text-secondary mb-6 leading-[1.6]">
                  For engineers building production RAG systems with query testing and multi-doc corpora.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2 text-text font-medium">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Everything in Community, plus:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Batch Multi-Document Ingestion (50 docs)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Query Retrieval Simulator (Top-k recall test)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Contextual Retrieval prefix generator</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>Local WebGPU embedding models (BGE-Small)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenEarlyAccess('Pro Developer Tier')}
                className="w-full py-2.5 px-4 rounded-control text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors active-press focus-ring flex items-center justify-center space-x-1.5"
              >
                <span>Join Early Access Priority</span>
              </button>
            </div>

            {/* TIER 3: Team & Enterprise (Frozen / Waitlist) */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 flex flex-col justify-between card-interactive">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-text-secondary">Team &amp; Enterprise</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-2 text-text-tertiary border border-separator font-semibold">
                    Waitlist
                  </span>
                </div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$99</span>
                  <span className="text-xs text-text-tertiary font-mono">/ month</span>
                </div>
                <p className="text-xs text-text-secondary mb-6 leading-[1.6]">
                  For teams automating knowledge base quality and syncing directly with vector databases.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2 text-text font-medium">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Everything in Pro, plus:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Shared Team Presets &amp; Workspaces</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Direct Vector DB Push (Pinecone / Qdrant)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>GitHub Actions CI/CD Knowledge Gate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success-text shrink-0" />
                    <span>Enterprise SSO &amp; Priority SLA support</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenEarlyAccess('Team & Enterprise Tier')}
                className="w-full py-2.5 px-4 rounded-control text-xs font-semibold bg-surface-2 hover:bg-surface-3 border border-separator text-text-secondary hover:text-text transition-colors active-press focus-ring"
              >
                <span>Request Enterprise Pilot</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION ACCORDION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-2/30">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-text mb-2">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Everything you need to know about ChunkLens architecture, security, and integration.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: 'Why should I optimize chunks before inserting them into a vector database?',
                a: 'Once embeddings are calculated and stored in Pinecone, Qdrant, or Chroma, fixing bad chunk boundaries requires re-embedding your entire knowledge base. Unoptimized chunks cause severed facts (hallucinations), bloated vector indexes, and wasted context window space.',
              },
              {
                q: 'Is my document text really never sent to any server?',
                a: "Yes. ChunkLens is built with an uncompromising zero-egress architecture. The strict Content Security Policy declares connect-src 'none'. All PDF extraction, TikToken tokenization, and vector cosine calculations happen in isolated client-side Web Workers on your machine.",
              },
              {
                q: 'Which tokenizers are supported for exact BPE calculation?',
                a: 'ChunkLens bundles official TikToken encoders including cl100k_base (GPT-4, text-embedding-3), o200k_base (GPT-4o), p50k_base (text-davinci-003), and r50k_base. You can switch tokenizers with one click to observe variance.',
              },
              {
                q: 'How does the boundary continuity metric work?',
                a: 'Boundary continuity measures the semantic cosine similarity between chunk N and chunk N+1. High scores (>40%) indicate natural prose flow across sections, while low scores (<20%) alert you that a key concept was severed abruptly.',
              },
              {
                q: 'Can I export the exact chunking code to my Python or Node.js codebase?',
                a: 'Yes. ChunkLens features one-click copyable code generators for LangChain Python, LlamaIndex, Haystack, LangChain JS, and standalone Python scripts with matching delimiters and token parameters.',
              },
            ].map((faq, idx) => (
              <div
                key={`faq-${idx}`}
                className="rounded-card border border-separator bg-surface-1 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-text hover:bg-surface-2/60 transition-colors focus-ring"
                >
                  <span>{faq.q}</span>
                  {activeFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-text-tertiary shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0 ml-2" />
                  )}
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-text-secondary leading-relaxed border-t border-separator/40 bg-surface-2/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
