import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { TokenizerEncoding, ChunkMetadata } from '../engine/types';
import { compareTokenizers, MultiModelComparisonResult } from '../engine/tokenizers/multiModel';
import { cn } from '../utils/cn';

interface TokenizerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  chunks: ChunkMetadata[];
  baselineEncoding: TokenizerEncoding;
}

export const TokenizerComparisonModal: React.FC<TokenizerComparisonModalProps> = ({
  isOpen,
  onClose,
  rawText,
  chunks,
  baselineEncoding,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'costs' | 'risks'>('tokens');
  const [customScaleDocs, setCustomScaleDocs] = useState<number>(10000);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const comparison: MultiModelComparisonResult = compareTokenizers(rawText, chunks, baselineEncoding);

  const baselineModel =
    baselineEncoding === 'o200k_base'
      ? comparison.models.find((m) => m.id === 'gpt-4o')
      : comparison.models.find((m) => m.id === 'gpt-4');

  const baselineTokens = baselineModel?.totalDocTokens || comparison.baselineTokens;
  const baselineChunkTokens = baselineModel?.totalChunkTokens || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-panel border border-border rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tokenizer-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-md bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 id="tokenizer-modal-title" className="text-base font-semibold text-white">
                Multi-Model Tokenizer & Ingestion Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cross-provider token variance, embedding cost projections, and RAG context truncation safety
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-surface border border-border hover:border-border-hover active-press focus-ring transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Baseline Overview Card */}
        <div className="px-6 py-3 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Active Baseline:</span>
            <span className="font-semibold text-white px-2 py-0.5 rounded bg-subtle border border-border-subtle font-mono">
              {baselineEncoding === 'o200k_base' ? 'OpenAI GPT-4o (o200k_base)' : 'OpenAI GPT-4 (cl100k_base)'}
            </span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-slate-300">
            <span>
              Doc Tokens: <strong className="text-white tabular-nums">{baselineTokens.toLocaleString()}</strong>
            </span>
            <span>
              Ingested Tokens (with Overlap):{' '}
              <strong className="text-primary-400 tabular-nums">{baselineChunkTokens.toLocaleString()}</strong>
            </span>
            <span>
              Chunks: <strong className="text-white tabular-nums">{chunks.length}</strong>
            </span>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="px-6 pt-3 border-b border-border bg-panel flex space-x-4 text-xs">
          <button
            onClick={() => setActiveTab('tokens')}
            className={cn(
              'pb-3 font-medium flex items-center space-x-2 border-b-2 transition-colors active-press',
              activeTab === 'tokens'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Layers className="h-4 w-4" />
            <span>Token Expansion Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('costs')}
            className={cn(
              'pb-3 font-medium flex items-center space-x-2 border-b-2 transition-colors active-press',
              activeTab === 'costs'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <DollarSign className="h-4 w-4" />
            <span>Embedding Ingestion Costs</span>
          </button>

          <button
            onClick={() => setActiveTab('risks')}
            className={cn(
              'pb-3 font-medium flex items-center space-x-2 border-b-2 transition-colors active-press',
              activeTab === 'risks'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Truncation Risk Guard</span>
            {comparison.truncationRisk.limit512Exceeded > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {comparison.truncationRisk.limit512Exceeded}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              <div className="border border-border rounded-md overflow-hidden bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-subtle text-slate-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Model / Provider</th>
                      <th className="py-2.5 px-3 font-semibold">Tokenizer Profile</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Doc Tokens</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Chunk Total</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Max Chunk</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Variance</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Chars/Tok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {comparison.models.map((model) => {
                      const isBaseline =
                        (baselineEncoding === 'o200k_base' && model.id === 'gpt-4o') ||
                        (baselineEncoding === 'cl100k_base' && model.id === 'gpt-4');

                      return (
                        <tr
                          key={model.id}
                          className={cn(
                            'hover:bg-subtle/50 transition-colors',
                            isBaseline && 'bg-primary-500/5'
                          )}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-sans font-medium text-white">{model.name}</span>
                              {model.isExact ? (
                                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                  Exact BPE
                                </span>
                              ) : (
                                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-700/50 text-slate-400 border border-border font-mono">
                                  Profile
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{model.tokenizerName}</td>
                          <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                            {model.totalDocTokens.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                            {model.totalChunkTokens.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                            {model.maxChunkTokens}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isBaseline ? (
                              <span className="text-slate-400 text-[11px]">Baseline (0%)</span>
                            ) : model.variancePercentVsBaseline > 0 ? (
                              <span className="inline-flex items-center space-x-0.5 text-amber-400 font-medium tabular-nums">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>+{model.variancePercentVsBaseline}%</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-0.5 text-emerald-400 font-medium tabular-nums">
                                <ArrowDownRight className="h-3 w-3" />
                                <span>{model.variancePercentVsBaseline}%</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                            {model.charsPerToken}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-400 bg-subtle p-3 rounded-md border border-border flex items-start space-x-2">
                <Scale className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Architecture Insight:</strong> OpenAI’s{' '}
                  <code className="text-primary-300">o200k_base</code> has a 200,000 token vocabulary offering ~12-18% higher
                  compression over legacy <code className="text-primary-300">cl100k_base</code>. Anthropic Claude’s tokenizer expands
                  more aggressively on punctuation, indentation, and code symbols. When chunking multi-model RAG pipelines, ensure target
                  chunk sizes do not violate the downstream model's effective context envelope.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-slate-300 font-medium">Vector Ingestion Cost Projections</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-slate-400">Scale Projection:</span>
                  <select
                    value={customScaleDocs}
                    onChange={(e) => setCustomScaleDocs(Number(e.target.value))}
                    className="bg-surface border border-border text-white text-xs rounded px-2 py-1 focus-ring"
                  >
                    <option value={1000}>1,000 Docs</option>
                    <option value={10000}>10,000 Docs</option>
                    <option value={50000}>50,000 Docs</option>
                    <option value={100000}>100,000 Docs</option>
                    <option value={1000000}>1,000,000 Docs</option>
                  </select>
                </div>
              </div>

              <div className="border border-border rounded-md overflow-hidden bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-subtle text-slate-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 font-semibold">Provider</th>
                      <th className="py-2.5 px-3 font-semibold">Embedding Model</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Rate / 1M Tokens</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Single Doc Cost</th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Scale ({customScaleDocs.toLocaleString()} Docs)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {comparison.costs.map((cost) => {
                      const scaleCost = Number((cost.singleDocCost * customScaleDocs).toFixed(2));
                      return (
                        <tr key={cost.model} className="hover:bg-subtle/50 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-medium text-white">{cost.provider}</td>
                          <td className="py-2.5 px-3 text-slate-300">{cost.model}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                            ${cost.ratePerMillion.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-accent-amber tabular-nums">
                            {cost.singleDocCost < 0.0001 ? '< $0.0001' : `$${cost.singleDocCost.toFixed(5)}`}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold tabular-nums">
                            ${scaleCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400">
                * Note: Ingestion cost assumes total ingested chunk volume ({baselineChunkTokens.toLocaleString()} tokens) including
                chunk overlaps. Self-hosted embedding models (e.g. BGE-M3, MiniLM) incur zero token API fees, only GPU compute costs.
              </p>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={cn(
                    'p-4 rounded-md border text-xs',
                    comparison.truncationRisk.limit512Exceeded > 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  )}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-semibold text-slate-200">512 Token Bound</span>
                    {comparison.truncationRisk.limit512Exceeded > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Applicable to: BERT, all-MiniLM-L6-v2, BGE-small, GTE-base
                  </p>
                  <div className="mt-3 font-mono">
                    {comparison.truncationRisk.limit512Exceeded > 0 ? (
                      <span className="text-amber-400 font-semibold">
                        {comparison.truncationRisk.limit512Exceeded} chunk(s) breached
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">All chunks safe (100%)</span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'p-4 rounded-md border text-xs',
                    comparison.truncationRisk.limit2048Exceeded > 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  )}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-semibold text-slate-200">2,048 Token Bound</span>
                    {comparison.truncationRisk.limit2048Exceeded > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Applicable to: Instructor-XL, Cohere Embed v2
                  </p>
                  <div className="mt-3 font-mono">
                    {comparison.truncationRisk.limit2048Exceeded > 0 ? (
                      <span className="text-amber-400 font-semibold">
                        {comparison.truncationRisk.limit2048Exceeded} chunk(s) breached
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">All chunks safe (100%)</span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'p-4 rounded-md border text-xs',
                    comparison.truncationRisk.limit8192Exceeded > 0
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                  )}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-semibold text-slate-200">8,192 Token Bound</span>
                    {comparison.truncationRisk.limit8192Exceeded > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Applicable to: OpenAI text-embedding-3, Voyage-3
                  </p>
                  <div className="mt-3 font-mono">
                    {comparison.truncationRisk.limit8192Exceeded > 0 ? (
                      <span className="text-red-400 font-semibold">
                        {comparison.truncationRisk.limit8192Exceeded} chunk(s) breached
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">All chunks safe (100%)</span>
                    )}
                  </div>
                </div>
              </div>

              {comparison.truncationRisk.limit512Exceeded > 0 && (
                <div className="p-3 bg-subtle border border-border rounded-md text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Silent Downstream Truncation Warning</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    The following chunk indices exceed 512 tokens:{' '}
                    <span className="font-mono text-amber-300 font-semibold">
                      {comparison.truncationRisk.exceededChunkIndices512.map((idx) => `#${idx}`).join(', ')}
                    </span>
                    . If this pipeline indexes into a 512-token dense retrieval model, any tokens beyond 512 will be silently discarded
                    at embed time without generating errors.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-panel flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            ChunkLens Multi-Model Engine • 100% Client-Side Ingestion Analysis
          </span>
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-md text-xs font-medium bg-surface hover:bg-subtle border border-border hover:border-border-hover text-slate-200 active-press focus-ring transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
