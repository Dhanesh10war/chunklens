import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Check,
  Sparkles,
  DollarSign,
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
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface LandingOverviewProps {
  onLaunchApp: (sampleId?: string) => void;
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
    text: `Operating Income for Q3 reached $14.2M, representing an increase compared to $11.1M in Q3 of the prior fiscal year.

Gross Margin expanded, driven by customer expansion and automated infrastructure efficiencies.

Free Cash Flow generated during the nine months ended September 30 was $38.6M, compared to $22.4M for the same period last year.`,
    blindSplits: [
      `Operating Income for Q3 reached $14.2M, representing an increase compared to $11.1M in Q3 of the prior fiscal year.\n\nGross Margin expanded, driven by customer expansion and automated infrastructure efficiencies.`,
      `Free Cash Flow generated during the nine months ended September 30 was $38.6M, comp`,
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

app = FastAPI(title="Vector Retrieval API")
vector_store = Chroma(collection_name="docs", embedding_function=OpenAIEmbeddings())

@app.post("/query")
async def retrieve_context(query: str, top_k: int = 4):
    results = vector_store.similarity_search_with_score(query, k=top_k)
    return [{"chunk": doc.page_content, "score": score} for doc, score in results]`,
    blindSplits: [
      `from fastapi import FastAPI, HTTPException\nfrom langchain_chroma import Chroma\nfrom langchain_openai import OpenAIEmbeddings\n\napp = FastAPI(title="Vector Retrieval API")\nvector_store = Chroma(coll`,
      `ection_name="docs", embedding_function=OpenAIEmbeddings())\n\n@app.post("/query")\nasync def retrieve_context(query: str, top_k: int = 4):\n    results = vector_store.similarity_search_with_score(query, k=top_k)\n    return [{"ch`,
      `unk": doc.page_content, "score": score} for doc, score in results]`,
    ],
  },
};

export const LandingOverview: React.FC<LandingOverviewProps> = ({
  onLaunchApp,
  onNavigatePage,
}) => {
  // Interactive Mini-Chunker state
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>('legal');
  const [miniChunkSize, setMiniChunkSize] = useState<number>(220);
  const [splitterMode, setSplitterMode] = useState<'recursive' | 'blind'>('recursive');
  const [hoveredChunkIdx, setHoveredChunkIdx] = useState<number | null>(null);

  // Honest Cost Formula Calculator state (no defaults for price)
  const [monthlyDocs, setMonthlyDocs] = useState<number>(1000);
  const [avgDocTokens, setAvgDocTokens] = useState<number>(5000);
  const [overlapPct, setOverlapPct] = useState<number>(15);
  const [pricePerMillionInput, setPricePerMillionInput] = useState<string>('');

  // Interactive Mini Heatmap hover/selected state
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number; score: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number; score: number }>({ r: 0, c: 1, score: 38 });
  const activeHeatmapCell = hoveredCell || selectedCell;

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const activeSample = MINI_SAMPLES[selectedSampleKey];

  // Calculate live chunks in Mini-Chunker (Labeled as Illustration)
  const miniChunks = useMemo(() => {
    if (splitterMode === 'blind') {
      return activeSample.blindSplits.map((text, idx) => ({
        id: `blind-${idx + 1}`,
        text,
        approxTokens: Math.round(text.length / 4),
        status: 'Severed mid-word/boundary',
        isSevered: true,
      }));
    }

    const raw = activeSample.text;
    const paragraphs = raw.split('\n\n').filter((p) => p.trim().length > 0);
    const result: { id: string; text: string; approxTokens: number; status: string; isSevered: boolean }[] = [];

    let current = '';
    let idx = 1;

    paragraphs.forEach((p) => {
      if ((current + '\n\n' + p).length / 4 > miniChunkSize && current.length > 0) {
        result.push({
          id: `c-${idx++}`,
          text: current.trim(),
          approxTokens: Math.round(current.length / 4),
          status: 'Paragraph Boundary Preserved',
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
        status: 'Paragraph Boundary Preserved',
        isSevered: false,
      });
    }

    return result;
  }, [selectedSampleKey, miniChunkSize, splitterMode, activeSample]);

  // Transparent Step-by-Step Cost Calculations
  const costCalculation = useMemo(() => {
    const baseTokens = monthlyDocs * avgDocTokens;
    const overlapTokens = Math.round(baseTokens * (overlapPct / 100));
    const totalIngestedTokens = baseTokens + overlapTokens;
    const priceNum = parseFloat(pricePerMillionInput);
    const hasPrice = !isNaN(priceNum) && priceNum > 0;

    const baseCostMonthly = hasPrice ? (baseTokens / 1_000_000) * priceNum : null;
    const overlapCostMonthly = hasPrice ? (overlapTokens / 1_000_000) * priceNum : null;
    const totalCostMonthly = hasPrice ? (totalIngestedTokens / 1_000_000) * priceNum : null;
    const totalCostAnnual = totalCostMonthly !== null ? totalCostMonthly * 12 : null;
    const overlapCostAnnual = overlapCostMonthly !== null ? overlapCostMonthly * 12 : null;

    return {
      baseTokens,
      overlapTokens,
      totalIngestedTokens,
      priceNum: hasPrice ? priceNum : null,
      baseCostMonthly,
      overlapCostMonthly,
      totalCostMonthly,
      totalCostAnnual,
      overlapCostAnnual,
    };
  }, [monthlyDocs, avgDocTokens, overlapPct, pricePerMillionInput]);

  // Mini Heatmap 4x4 matrix values
  const miniHeatmapData = [
    [100, 38, 14, 8],
    [38, 100, 42, 12],
    [14, 42, 100, 28],
    [8, 12, 28, 100],
  ];

  return (
    <div className="flex flex-col font-sans">
      {/* 1. HERO SECTION WITH RADIAL GLOW & LIVE METRICS */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden hero-glow">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Security Trust Pill */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface-2 border border-separator text-xs font-mono mb-6 shadow-subtle select-none">
            <span className="h-2 w-2 rounded-full bg-status-success inline-block animate-pulse" />
            <span className="font-medium text-text">100% Client-Side · Zero Network Egress</span>
            <span className="text-separator hidden sm:inline">|</span>
            <span className="text-2xs text-text-secondary font-mono hidden sm:inline">Zero Server Upload</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.12] mb-5 title-tracking">
            Stop Guessing Your RAG Chunks.{' '}
            <span className="text-accent block sm:inline">Visualize &amp; Optimize First.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
            Eliminate severed context boundaries and unoptimized token waste before saving to vector stores.
            Tune chunk strategies, token limits, and boundary continuity in real time on your machine.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center mb-10">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onLaunchApp()}
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto px-6 py-2.5 rounded-control text-sm font-semibold shadow-card group"
            >
              <span>Launch Visualizer</span>
            </Button>

            <button
              type="button"
              onClick={() => onLaunchApp('legal-saas-agreement')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-control text-sm font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors active-press focus-ring flex items-center justify-center space-x-1.5"
            >
              <FileCheck className="h-4 w-4 text-accent" />
              <span>Try with Legal Agreement</span>
            </button>
          </div>

          {/* Micro-proof points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-text-tertiary select-none font-mono">
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success-text" />
              <span>Zero server upload</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success-text" />
              <span>Exact BPE Tokenizers</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success-text" />
              <span>5 Chunking Strategies</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success-text" />
              <span>1-Click Code Export</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PLAYGROUND SIMULATION (ILLUSTRATION) */}
      <section className="py-14 px-4 sm:px-6 bg-surface-2/40 border-y border-separator">
        <div className="max-w-5xl mx-auto">
          {/* Header & Controls Cluster */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
                <Sparkles className="h-3 w-3" />
                <span>Illustration: Playground Simulation</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                Live Document Chunking Simulation
              </h2>
            </div>

            {/* Splitter Mode Comparison Switcher */}
            <div className="flex items-center space-x-2 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center p-1 rounded-control bg-surface-1 border border-separator text-xs">
                <button
                  type="button"
                  onClick={() => setSplitterMode('recursive')}
                  className={cn(
                    'px-3 py-1 rounded-control font-medium transition-all active-press flex items-center space-x-1.5',
                    splitterMode === 'recursive'
                      ? 'bg-accent text-white shadow-subtle font-semibold'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Recursive Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSplitterMode('blind')}
                  className={cn(
                    'px-3 py-1 rounded-control font-medium transition-all active-press flex items-center space-x-1.5',
                    splitterMode === 'blind'
                      ? 'bg-status-warn-subtle text-status-warn-text border border-status-warn/30 font-semibold'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Fixed Character Split</span>
                </button>
              </div>

              {/* Sample Selector Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-surface-1 p-1 rounded-control border border-separator text-xs">
                {Object.entries(MINI_SAMPLES).map(([key, data]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSampleKey(key)}
                    className={cn(
                      'px-2.5 py-1 rounded-control font-medium transition-all active-press',
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
          <div className="rounded-card border border-separator bg-surface-1 shadow-card p-4 sm:p-6">
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

              {/* Status Pill */}
              <div className="flex items-center space-x-3 text-2xs">
                <span className="text-text-tertiary">
                  Partitions: <strong className="text-text font-semibold">{miniChunks.length} chunks</strong>
                </span>
                <span className="text-separator">|</span>
                <span className="text-text-tertiary">
                  Strategy:{' '}
                  <strong className="text-text font-semibold">
                    {splitterMode === 'recursive' ? 'Recursive Paragraph Delimiters' : 'Fixed Character Slicing'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Chunks Stream Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {miniChunks.map((chunk, idx) => {
                const isHovered = hoveredChunkIdx === idx;
                const fillRatio = Math.min(100, Math.round((chunk.approxTokens / miniChunkSize) * 100));
                return (
                  <div
                    key={chunk.id}
                    onMouseEnter={() => setHoveredChunkIdx(idx)}
                    onMouseLeave={() => setHoveredChunkIdx(null)}
                    className={cn(
                      'p-4 rounded-control border transition-all flex flex-col justify-between text-xs',
                      chunk.isSevered
                        ? 'border-status-warn/40 bg-status-warn-subtle/20'
                        : isHovered
                        ? 'border-accent shadow-card bg-surface-2/60'
                        : 'border-separator bg-surface-2/30 hover:border-separator/90'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-2xs font-mono">
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

                      {/* Visual token budget fill bar */}
                      <div className="w-full bg-surface-2 rounded-full h-1 mb-2.5 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-150',
                            chunk.isSevered ? 'bg-status-warn' : 'bg-accent'
                          )}
                          style={{ width: `${fillRatio}%` }}
                        />
                      </div>

                      <p dir="auto" className="text-xs text-text-secondary font-mono leading-relaxed line-clamp-3">
                        {chunk.text}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-separator/60 flex items-center justify-between text-2xs font-mono text-text-tertiary">
                      <span>Boundary:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          chunk.isSevered ? 'text-status-warn-text' : 'text-status-success-text'
                        )}
                      >
                        {chunk.status}
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

      {/* 3. COST & OVERLAP TOKEN FORMULA CALCULATOR (TRANSPARENT STEPS) */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
              <Calculator className="h-3.5 w-3.5" />
              <span>Step-by-Step Cost Calculator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-2">
              Embedding Ingestion Cost Formula
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Calculate exact token volume and embedding expenditure with full transparency into every arithmetic step.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Input Controls (7 cols) */}
            <div className="lg:col-span-7 rounded-card border border-separator bg-surface-1 shadow-subtle p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                {/* Input 1: Monthly Documents */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="roi-docs-slider" className="text-xs font-semibold text-text">
                      Monthly Ingested Documents
                    </label>
                    <span className="font-mono text-xs font-bold text-accent tabular-nums">
                      {monthlyDocs.toLocaleString()} docs
                    </span>
                  </div>
                  <input
                    id="roi-docs-slider"
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={monthlyDocs}
                    onChange={(e) => setMonthlyDocs(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>100</span>
                    <span>5,000</span>
                    <span>10,000</span>
                  </div>
                </div>

                {/* Input 2: Average Doc Length */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="roi-tokens-slider" className="text-xs font-semibold text-text">
                      Average Document Length (Tokens)
                    </label>
                    <span className="font-mono text-xs font-bold text-accent tabular-nums">
                      {avgDocTokens.toLocaleString()} tok
                    </span>
                  </div>
                  <input
                    id="roi-tokens-slider"
                    type="range"
                    min="500"
                    max="20000"
                    step="500"
                    value={avgDocTokens}
                    onChange={(e) => setAvgDocTokens(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>500 tok</span>
                    <span>10,000 tok</span>
                    <span>20,000 tok</span>
                  </div>
                </div>

                {/* Input 3: Chunk Overlap Ratio */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="roi-overlap-slider" className="text-xs font-semibold text-text">
                      Chunk Overlap Ratio
                    </label>
                    <span className="font-mono text-xs font-bold text-status-warn-text tabular-nums">
                      {overlapPct}%
                    </span>
                  </div>
                  <input
                    id="roi-overlap-slider"
                    type="range"
                    min="0"
                    max="40"
                    step="5"
                    value={overlapPct}
                    onChange={(e) => setOverlapPct(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>0% (No overlap)</span>
                    <span>20% (Default)</span>
                    <span>40% (High overlap)</span>
                  </div>
                </div>

                {/* Input 4: Embedding Price per 1M Tokens (No default) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="model-price-input" className="text-xs font-semibold text-text">
                      Embedding Model Rate per 1M Tokens (USD)
                    </label>
                    <span className="text-2xs font-mono text-text-tertiary hidden sm:inline">Reference Rates:</span>
                  </div>
                  {/* Model Rate Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: 'text-3-small ($0.02)', val: '0.02' },
                      { label: 'text-3-large ($0.13)', val: '0.13' },
                      { label: 'Cohere v3 ($0.10)', val: '0.10' },
                      { label: 'Voyage 3 ($0.12)', val: '0.12' },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setPricePerMillionInput(preset.val)}
                        className={cn(
                          'px-2 py-0.5 rounded text-2xs font-mono border transition-all active-press',
                          pricePerMillionInput === preset.val
                            ? 'bg-accent text-white border-accent font-semibold shadow-subtle'
                            : 'bg-surface-2 hover:bg-surface-3 text-text-secondary border-separator'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-text-tertiary">$</span>
                    <input
                      id="model-price-input"
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="e.g. 0.02 for text-embedding-3-small"
                      value={pricePerMillionInput}
                      onChange={(e) => setPricePerMillionInput(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-control bg-surface-2 border border-separator text-xs font-mono text-text focus-ring"
                    />
                  </div>
                  <span className="text-2xs text-text-tertiary font-mono block mt-1">
                    Select a reference rate or enter custom provider pricing.
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Formula Output (5 cols) */}
            <div className="lg:col-span-5 rounded-card border-2 border-separator bg-surface-1 shadow-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-separator mb-4">
                  <span className="text-xs font-mono text-text-secondary font-semibold">Step-by-Step Calculation</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text border border-separator font-semibold">
                    Transparent Math
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-2 rounded bg-surface-2/60 border border-separator/60">
                    <span className="text-2xs text-text-tertiary block">Step 1: Base Document Tokens</span>
                    <span className="text-text font-bold">
                      {monthlyDocs.toLocaleString()} docs &times; {avgDocTokens.toLocaleString()} tok ={' '}
                      {(costCalculation.baseTokens / 1_000_000).toFixed(2)}M tokens/mo
                    </span>
                  </div>

                  <div className="p-2 rounded bg-surface-2/60 border border-separator/60">
                    <span className="text-2xs text-text-tertiary block">Step 2: Overlap Redundancy Volume</span>
                    <span className="text-status-warn-text font-bold">
                      {(costCalculation.baseTokens / 1_000_000).toFixed(2)}M &times; {overlapPct}% ={' '}
                      {(costCalculation.overlapTokens / 1_000_000).toFixed(2)}M redundant tok/mo
                    </span>
                  </div>

                  <div className="p-2 rounded bg-surface-2/60 border border-separator/60">
                    <span className="text-2xs text-text-tertiary block">Step 3: Total Ingested Tokens</span>
                    <span className="text-text font-bold">
                      {(costCalculation.totalIngestedTokens / 1_000_000).toFixed(2)}M tokens/mo
                    </span>
                  </div>

                  <div className="p-3 rounded-control bg-accent-subtle/30 border border-accent/25">
                    <span className="text-2xs text-accent font-semibold block mb-1">
                      Step 4: Embedding Spend (Based on User Rate)
                    </span>
                    {costCalculation.priceNum !== null ? (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-text">
                          ${costCalculation.totalCostMonthly?.toFixed(2)} / month
                        </div>
                        <div className="text-2xs text-text-secondary">
                          ${costCalculation.totalCostAnnual?.toFixed(2)} / year total embedding cost
                        </div>
                        <div className="text-2xs text-status-warn-text font-semibold pt-1 border-t border-separator/60">
                          Includes ${costCalculation.overlapCostAnnual?.toFixed(2)}/yr spent purely on overlap redundancy.
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xs text-text-tertiary italic">
                        Enter your price per 1M tokens above to calculate dollar amounts.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-separator">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onLaunchApp()}
                  className="w-full text-xs font-semibold"
                >
                  <span>Launch Visualizer</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE FAILURES SOLVED + INTERACTIVE MINI HEATMAP */}
      <section className="py-16 px-4 sm:px-6 bg-surface-2/30 border-y border-separator">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono text-accent font-semibold">Core Product Rationale</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mt-1 mb-2">
              Three Failures Solved by Visual Chunking
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Stop debugging RAG pipelines downstream. Optimize at the point of ingestion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between card-interactive">
              <div>
                <div className="h-10 w-10 rounded-control bg-status-warn-subtle border border-status-warn/25 flex items-center justify-center text-status-warn-text mb-4">
                  <SplitSquareVertical className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">Context Boundary Fractures</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Standard splitters sever sentences mid-thought or split Markdown tables. When retrieved, the LLM hallucinates because the vital clause was cut off.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Visual orphan warnings &amp; sequential continuity metrics keep context whole.
              </div>
            </div>

            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between card-interactive">
              <div>
                <div className="h-10 w-10 rounded-control bg-accent-subtle border border-accent/25 flex items-center justify-center text-accent mb-4">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">Silent Token Bleed</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Blind 20% overlaps across 10,000 files store millions of redundant tokens in vector DBs, inflating annual storage bills without increasing answer accuracy.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Real-time ingested vs document token breakdown and live embedding cost meter.
              </div>
            </div>

            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between card-interactive">
              <div>
                <div className="h-10 w-10 rounded-control bg-status-success-subtle border border-status-success/25 flex items-center justify-center text-status-success mb-4">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">Character Count Mismatches</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Splitting by character count ignores Byte-Pair Encoding. 1,000 characters of Markdown or code can swing from 180 to 450 tokens, causing sudden prompt overflow.
                </p>
              </div>
              <div className="pt-3 border-t border-separator text-2xs font-mono text-status-success-text">
                ✓ Real client-side TikToken BPE tokenizers give exact token counts before embedding.
              </div>
            </div>
          </div>

          {/* INTERACTIVE MINI SIMILARITY HEATMAP SPOTLIGHT */}
          <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 pb-4 border-b border-separator">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
                  <Grid3X3 className="h-3.5 w-3.5" />
                  <span>Interactive Heatmap Preview</span>
                </div>
                <h3 className="text-base font-bold text-text">Cross-Chunk Lexical Overlap Matrix</h3>
              </div>
              <div className="text-2xs font-mono text-text-tertiary">
                Hover any cell to inspect lexical similarity between chunk pairs
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* 4x4 Grid (7 cols) */}
              <div className="md:col-span-7 flex justify-center">
                <div className="inline-block p-2.5 rounded-control bg-surface-2 border border-separator select-none shadow-subtle">
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
                        const isSelected = activeHeatmapCell.r === rIdx && activeHeatmapCell.c === cIdx;
                        return (
                          <button
                            key={`cell-${rIdx}-${cIdx}`}
                            type="button"
                            onClick={() => setSelectedCell({ r: rIdx, c: cIdx, score })}
                            onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx, score })}
                            onMouseLeave={() => setHoveredCell(null)}
                            aria-label={`Chunk ${rIdx + 1} to Chunk ${cIdx + 1}: ${score}% lexical overlap`}
                            className={cn(
                              'h-9 w-9 sm:h-11 sm:w-11 rounded font-mono text-2xs flex items-center justify-center transition-all focus-ring active-press',
                              isSelf
                                ? 'bg-accent text-white font-bold'
                                : score >= 40
                                ? 'bg-[var(--heat-high)] text-text font-semibold'
                                : score >= 20
                                ? 'bg-[var(--heat-mid)] text-text font-medium'
                                : 'bg-[var(--heat-low)] text-text-secondary border border-separator/50',
                              isSelected && 'ring-2 ring-accent scale-105 z-10 shadow-subtle'
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
              <div className="md:col-span-5 p-5 rounded-control bg-surface-2 border border-separator text-xs space-y-3 font-mono shadow-subtle">
                <div className="flex items-center justify-between text-2xs text-text-tertiary border-b border-separator pb-2 font-semibold">
                  <span>Pair Continuity Diagnostics</span>
                  <span className="text-text-secondary">Chunk #{activeHeatmapCell.r + 1} &harr; #{activeHeatmapCell.c + 1}</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-text">Lexical Overlap</span>
                    <span className="text-accent text-base font-extrabold tabular-nums">
                      {activeHeatmapCell.score}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-surface-1 rounded-full h-1.5 overflow-hidden border border-separator/40">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-200',
                        activeHeatmapCell.score === 100
                          ? 'bg-accent'
                          : activeHeatmapCell.score >= 40
                          ? 'bg-status-success'
                          : activeHeatmapCell.score >= 20
                          ? 'bg-status-warn'
                          : 'bg-text-tertiary'
                      )}
                      style={{ width: `${activeHeatmapCell.score}%` }}
                    />
                  </div>

                  <div className="pt-1">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-2xs font-semibold font-mono',
                        activeHeatmapCell.score === 100
                          ? 'bg-accent-subtle text-accent border border-accent/25'
                          : activeHeatmapCell.score >= 40
                          ? 'bg-status-success-subtle text-status-success-text border border-status-success/25'
                          : activeHeatmapCell.score >= 20
                          ? 'bg-status-warn-subtle text-status-warn-text border border-status-warn/25'
                          : 'bg-surface-1 text-text-tertiary border border-separator'
                      )}
                    >
                      {activeHeatmapCell.score === 100
                        ? 'Identity Diagonal'
                        : activeHeatmapCell.score >= 40
                        ? 'Strong Topical Vocabulary Bridge'
                        : activeHeatmapCell.score >= 20
                        ? 'Balanced Boundary Transition'
                        : 'Distinct Topical Domain'}
                    </span>
                  </div>

                  <p className="text-2xs text-text-secondary font-sans leading-relaxed pt-1">
                    {activeHeatmapCell.score === 100
                      ? 'Self similarity diagonal: perfect 1.0 cosine match.'
                      : activeHeatmapCell.score >= 40
                      ? 'High cross-chunk overlap. Context is well preserved across the partition boundary, ensuring fact continuity.'
                      : activeHeatmapCell.score >= 20
                      ? 'Optimal boundary transition. Chunks maintain context continuity without wasteful duplicate token inflation.'
                      : 'Low similarity. Chunks discuss distinct sub-topics without wasteful redundancy.'}
                  </p>
                </div>
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
                  <div className="text-2xs text-text-tertiary">5 strategies &amp; continuity math</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
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
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
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
                  <div className="text-2xs text-text-tertiary">Web Worker client-side proof</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-status-success-text group-hover:translate-x-0.5 transition-all" />
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
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT ROADMAP & UPCOMING CAPABILITIES */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-2 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Product Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-3">
            Engineered for Production RAG
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed font-sans">
            ChunkLens is a zero-egress, client-side RAG engineering engine. Inspect boundaries, eliminate context fractures, and prevent silent token inflation before data reaches your vector store.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            <div className="p-4 rounded-card border border-separator bg-surface-1 shadow-subtle">
              <span className="font-semibold text-text text-xs block mb-1">Batch Document Evaluation</span>
              <p className="text-2xs text-text-secondary leading-relaxed">
                Evaluating multi-document corpora and directory structures within isolated local browser memory.
              </p>
            </div>
            <div className="p-4 rounded-card border border-separator bg-surface-1 shadow-subtle">
              <span className="font-semibold text-text text-xs block mb-1">Vector Retrieval Simulator</span>
              <p className="text-2xs text-text-secondary leading-relaxed">
                Benchmarking dense top-k query matching directly against client-side chunk embedding vectors.
              </p>
            </div>
            <div className="p-4 rounded-card border border-separator bg-surface-1 shadow-subtle">
              <span className="font-semibold text-text text-xs block mb-1">Custom Tokenizer Encodings</span>
              <p className="text-2xs text-text-secondary leading-relaxed">
                Configuring custom vocabulary tables and delimiter grammars for proprietary enterprise models.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => onLaunchApp()}
              icon={<ArrowRight className="h-4 w-4" />}
              className="px-6 py-2.5 rounded-control text-xs font-semibold shadow-subtle"
            >
              <span>Launch Visualizer</span>
            </Button>
            <button
              type="button"
              onClick={() => onNavigatePage('features')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-control text-xs font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors focus-ring"
            >
              <Cpu className="h-4 w-4 text-accent" />
              <span>Explore Chunking Engines</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-16 px-4 sm:px-6 bg-surface-2/30 border-t border-separator">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-text mb-2">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Everything you need to know about ChunkLens architecture, security, and integration.
            </p>
          </div>

          <div className="space-y-3">
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
                a: 'ChunkLens bundles official TikToken encoders for OpenAI models including cl100k_base (GPT-4, text-embedding-3) and o200k_base (GPT-4o). Non-OpenAI models (such as Claude, Gemini, and Llama) are estimated using reference vocabulary compression ratios.',
              },
              {
                q: 'How does the boundary continuity metric work?',
                a: 'Boundary continuity measures the lexical TF-IDF cosine similarity between chunk N and chunk N+1 to inspect vocabulary transitions across partition boundaries.',
              },
              {
                q: 'Can I export the exact chunking code to my Python or Node.js codebase?',
                a: 'Yes. ChunkLens features one-click copyable code generators for LangChain Python, LlamaIndex, LangChain JavaScript, and standalone Python scripts with matching delimiters and token parameters.',
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
