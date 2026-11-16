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
  HelpCircle,
  Shield,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface LandingOverviewProps {
  onLaunchApp: (sampleId?: string) => void;
  onOpenEarlyAccess: (tierName: string) => void;
  onNavigatePage: (page: string) => void;
}

const MINI_SAMPLES: Record<string, { label: string; tag: string; text: string }> = {
  legal: {
    label: 'Legal Master Agreement',
    tag: 'Contract Clause',
    text: `1. INDEMNIFICATION AND WARRANTIES. Provider shall defend, indemnify, and hold harmless Customer from and against any third-party claims alleging that the Subscription Services infringe any valid patent or copyright.

2. LIMITATION OF LIABILITY. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF THIS AGREEMENT.

3. GOVERNING LAW AND DISPUTE RESOLUTION. This Agreement shall be governed by the laws of the State of Delaware, without regard to conflict of laws principles.`,
  },
  financial: {
    label: 'Financial Performance 10-Q',
    tag: 'Financial Disclosure',
    text: `Operating Income for Q3 reached $14.2M, representing a 28% year-over-year increase compared to $11.1M in Q3 of the prior fiscal year.

Gross Margin expanded by 180 basis points to 74.2%, driven by enterprise customer expansion and automated infrastructure efficiencies.

Free Cash Flow generated during the nine months ended September 30 was $38.6M, compared to $22.4M for the same period last year.`,
  },
  code: {
    label: 'Python Vector Search Service',
    tag: 'FastAPI + LangChain',
    text: `from fastapi import FastAPI, HTTPException
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

app = FastAPI(title="Semantic Retrieval API")
vector_store = Chroma(collection_name="docs", embedding_function=OpenAIEmbeddings())

@app.post("/query")
async def retrieve_context(query: str, top_k: int = 4):
    results = vector_store.similarity_search_with_score(query, k=top_k)
    return [{"chunk": doc.page_content, "score": score} for doc, score in results]`,
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

  // Interactive ROI Calculator state
  const [monthlyDocs, setMonthlyDocs] = useState<number>(2500);
  const [avgDocTokens, setAvgDocTokens] = useState<number>(10000);
  const [overlapPct, setOverlapPct] = useState<number>(20);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Calculate live chunks in Mini-Chunker
  const miniChunks = useMemo(() => {
    const raw = MINI_SAMPLES[selectedSampleKey].text;
    const paragraphs = raw.split('\n\n').filter((p) => p.trim().length > 0);
    const result: { id: string; text: string; approxTokens: number }[] = [];

    let current = '';
    let idx = 1;

    paragraphs.forEach((p) => {
      if ((current + '\n\n' + p).length / 4 > miniChunkSize && current.length > 0) {
        result.push({
          id: `c-${idx++}`,
          text: current.trim(),
          approxTokens: Math.round(current.length / 4),
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
      });
    }

    return result;
  }, [selectedSampleKey, miniChunkSize]);

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

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-accent/6 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Security Trust Pill */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-status-success-subtle border border-status-success/25 text-status-success-text text-xs font-mono mb-6 shadow-subtle select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success shrink-0" />
            <span>100% Client-Side · Zero Network Egress · Web Worker Powered</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.12] mb-5">
            Stop Guessing Your RAG Chunks.{' '}
            <span className="text-accent block sm:inline">Visualize &amp; Optimize First.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
            Eliminate context boundary hallucinations and cut 30%–50% of wasted vector store token costs before ingestion.
            Tune splitters, token budgets, and boundary continuity in real time on your machine.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center mb-10">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onLaunchApp()}
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto px-6 py-2.5 rounded-control text-sm font-semibold shadow-card"
            >
              <span>Launch Interactive Visualizer</span>
            </Button>

            <button
              onClick={() => onLaunchApp('legal-saas-agreement')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-control text-sm font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text transition-colors active-press focus-ring"
            >
              Try with Legal Agreement
            </button>
          </div>

          {/* Micro-proof points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-text-tertiary select-none font-mono">
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>Zero server upload</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>5 BPE Tokenizers</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>4 RAG Splitters</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <Check className="h-3.5 w-3.5 text-status-success" />
              <span>1-Click Code Export</span>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC FEATURE 1: INTERACTIVE LIVE MINI-CHUNKER */}
      <section className="py-12 px-4 sm:px-6 bg-surface-2/40 border-y border-separator">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
                <Sparkles className="h-3 w-3" />
                <span>Interactive Playground</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                Live Document Chunking Simulation
              </h2>
            </div>

            {/* Sample Selector Pills */}
            <div className="flex items-center space-x-1.5 bg-surface-1 p-1 rounded-control border border-separator select-none text-xs">
              {Object.entries(MINI_SAMPLES).map(([key, data]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedSampleKey(key)}
                  className={cn(
                    'px-2.5 py-1 rounded-control font-medium transition-all active-press',
                    selectedSampleKey === key
                      ? 'bg-accent text-white shadow-subtle'
                      : 'text-text-secondary hover:text-text'
                  )}
                >
                  {data.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Playground Box */}
          <div className="rounded-card border border-separator bg-surface-1 shadow-card p-4 sm:p-6">
            {/* Control Bar: Chunk Size Slider */}
            <div className="pb-4 mb-4 border-b border-separator flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
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
                <span className="text-accent font-semibold tabular-nums w-14 text-right">
                  {miniChunkSize} tok
                </span>
              </div>

              <div className="flex items-center space-x-4 text-text-tertiary">
                <span>Result: <strong className="text-text">{miniChunks.length} chunks</strong></span>
                <span>Algorithm: <strong className="text-text">Recursive BPE</strong></span>
              </div>
            </div>

            {/* Generated Chunk Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {miniChunks.map((chunk, idx) => (
                <div
                  key={chunk.id}
                  className="p-3.5 rounded-control border border-separator bg-surface-2/60 flex flex-col justify-between hover:border-accent/40 transition-colors shadow-subtle"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-accent">Chunk #{idx + 1}</span>
                      <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-1 border border-separator text-text-secondary tabular-nums">
                        {chunk.approxTokens} tok
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary font-sans line-clamp-3 leading-relaxed">
                      {chunk.text}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-separator/60 flex items-center justify-between text-2xs font-mono text-text-tertiary">
                    <span>Boundary: Safe</span>
                    <span className="text-status-success-text font-medium">100% Intact</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Workspace CTA footer */}
            <div className="mt-5 pt-3 border-t border-separator flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-text-secondary">
                Need multi-model tokenizer comparisons, cosine overlap heatmaps, and full PDF extraction?
              </span>
              <button
                type="button"
                onClick={() => onLaunchApp(selectedSampleKey === 'legal' ? 'legal-saas-agreement' : 'quarterly-financial')}
                className="text-accent hover:text-accent-hover font-semibold inline-flex items-center space-x-1"
              >
                <span>Open Full Visualizer Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC FEATURE 2: INTERACTIVE ROI & TOKEN SAVINGS CALCULATOR */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-1 font-semibold">
              <Calculator className="h-3.5 w-3.5" />
              <span>Cost Optimization Calculator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mb-2">
              Calculate Your RAG Ingestion Waste
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              See how much your organization spends storing unoptimized, redundant duplicate tokens in vector databases.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Input Sliders (7 cols) */}
            <div className="lg:col-span-7 rounded-card border border-separator bg-surface-1 shadow-subtle p-6 flex flex-col justify-between">
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
                    min="2000"
                    max="30000"
                    step="1000"
                    value={avgDocTokens}
                    onChange={(e) => setAvgDocTokens(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>2,000 (Short)</span>
                    <span>15,000 (Medium)</span>
                    <span>30,000 (Long)</span>
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
                    className="w-full accent-status-warn cursor-pointer"
                  />
                  <div className="flex justify-between text-2xs font-mono text-text-tertiary mt-1">
                    <span>10% (Low)</span>
                    <span>20% (Common Default)</span>
                    <span>35% (Aggressive)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-separator text-2xs text-text-tertiary flex items-center space-x-2">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Calculated using blended vector store memory costs ($0.05 / 1M) and embedding API rates ($0.02 / 1M).</span>
              </div>
            </div>

            {/* Result Metrics Box (5 cols) */}
            <div className="lg:col-span-5 rounded-card border-2 border-accent bg-surface-1 shadow-card p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-text-secondary font-semibold">Annual Waste Breakdown</span>

                <div className="my-6 space-y-4">
                  <div>
                    <span className="text-2xs font-mono text-text-tertiary">Duplicate Redundant Tokens / Year:</span>
                    <div className="text-2xl font-bold font-mono text-text tabular-nums">
                      {(savingsData.annualWastedTokens / 1_000_000).toFixed(1)} Million
                    </div>
                  </div>

                  <div>
                    <span className="text-2xs font-mono text-text-tertiary">Estimated Annual Wasted Spend:</span>
                    <div className="text-xl font-bold font-mono text-status-error-text tabular-nums">
                      ${savingsData.annualWastedSpend.toFixed(0)} / yr
                    </div>
                  </div>

                  <div className="p-3.5 rounded-control bg-status-success-subtle border border-status-success/25">
                    <span className="text-2xs font-mono text-status-success-text font-semibold block mb-0.5">
                      Potential Annual Savings with ChunkLens:
                    </span>
                    <div className="text-2xl font-bold font-mono text-status-success-text tabular-nums">
                      ${savingsData.potentialAnnualSavings.toFixed(0)} / yr
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => onLaunchApp()}
                className="w-full text-xs font-semibold"
              >
                <span>Optimize Your Documents Free</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY RAG PIPELINES FAIL (PAIN VS SOLUTION) */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-control bg-status-warn-subtle border border-status-warn/25 flex items-center justify-center text-status-warn mb-4">
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

            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
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

            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
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

          {/* Deep-dive Navigation Links */}
          <div className="mt-10 pt-8 border-t border-separator/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigatePage('features')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring"
            >
              <div className="flex items-center space-x-2.5">
                <Cpu className="h-4 w-4 text-accent" />
                <div>
                  <div className="font-semibold text-text group-hover:text-accent transition-colors">Splitter Engines</div>
                  <div className="text-2xs text-text-tertiary">4 splitters &amp; continuity math</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage('use-cases')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring"
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
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring"
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="h-4 w-4 text-status-success" />
                <div>
                  <div className="font-semibold text-text group-hover:text-status-success transition-colors">Zero-Egress Security</div>
                  <div className="text-2xs text-text-tertiary">Web Worker air-gap proof</div>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-text-tertiary group-hover:text-status-success group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage('docs')}
              className="p-3.5 rounded-control bg-surface-1 hover:bg-surface-2 border border-separator/80 text-left transition-colors flex items-center justify-between group focus-ring"
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

      {/* PRICING & ROADMAP SECTION (FROZEN / EARLY ACCESS) */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono text-accent font-semibold">Product Tiers &amp; Roadmap</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text mt-1 mb-2">
              Transparent, Developer-Friendly Tiers
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              The full single-document visualizer is 100% free and open-source. Commercial multi-document batch features are available via priority early access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TIER 1: Community (Active Now) */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-text-secondary">Community</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-status-success-subtle text-status-success-text border border-status-success/25">
                    Available Now
                  </span>
                </div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$0</span>
                  <span className="text-xs text-text-tertiary font-mono">/ forever</span>
                </div>
                <p className="text-xs text-text-secondary mb-6">
                  For individual AI engineers inspecting and tuning chunk strategies for single documents.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>100% Client-Side Visualizer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Single document inspection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>5 bundled TikToken BPE tokenizers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Cosine similarity matrix heatmap</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>LangChain &amp; LlamaIndex code export</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Zero telemetry &amp; zero egress</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => onLaunchApp()}
                className="w-full text-xs font-semibold"
              >
                <span>Launch Free Visualizer</span>
              </Button>
            </div>

            {/* TIER 2: Pro Developer (Frozen / Early Access) */}
            <div className="p-6 rounded-card border-2 border-accent/60 bg-surface-1 shadow-card flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-accent text-white font-mono text-2xs font-semibold shadow-subtle">
                In Development · Early Access
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 mt-1">
                  <span className="text-xs font-mono font-semibold text-text">Pro Developer</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text border border-separator font-semibold">
                    Target Q1 2027
                  </span>
                </div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$29</span>
                  <span className="text-xs text-text-tertiary font-mono">/ month</span>
                </div>
                <p className="text-xs text-text-secondary mb-6">
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
                    <span>Anthropic Contextual Retrieval prepender</span>
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
                className="w-full py-2.5 px-4 rounded-control text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors active-press focus-ring flex items-center justify-center space-x-1.5 shadow-subtle"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Join Early Access Priority</span>
              </button>
            </div>

            {/* TIER 3: Team & Enterprise (Frozen / Waitlist) */}
            <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold text-text-secondary">Team &amp; Enterprise</span>
                  <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text-tertiary border border-separator">
                    Waitlist
                  </span>
                </div>
                <div className="flex items-baseline space-x-1 mb-4">
                  <span className="text-3xl font-bold text-text">$99</span>
                  <span className="text-xs text-text-tertiary font-mono">/ month</span>
                </div>
                <p className="text-xs text-text-secondary mb-6">
                  For teams automating knowledge base quality and syncing directly with vector databases.
                </p>

                <div className="space-y-2.5 text-xs text-text-secondary border-t border-separator pt-4 mb-6">
                  <div className="flex items-center space-x-2 text-text font-medium">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Everything in Pro, plus:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Shared Team Presets &amp; Workspaces</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>Direct Vector DB Push (Pinecone / Qdrant)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
                    <span>GitHub Actions CI/CD Knowledge Gate</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-status-success shrink-0" />
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

      {/* FAQ SECTION */}
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
