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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="relative bg-surface-1 surface-translucent border border-separator rounded-t-2xl sm:rounded-panel max-w-4xl w-full max-h-modal flex flex-col shadow-modal overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tokenizer-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-separator bg-surface-1/50 surface-translucent shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-control bg-surface-2 text-accent border border-separator">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 id="tokenizer-modal-title" className="text-base font-semibold text-text">
                Multi-Model Tokenizer &amp; Ingestion Matrix
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Cross-provider token variance, embedding cost projections, and RAG context truncation safety
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-control text-text-secondary hover:text-text bg-surface-2 border border-separator hover:bg-surface-3 active-press focus-ring transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Baseline Overview Card */}
        <div className="px-6 py-3 bg-surface-2/40 border-b border-separator flex flex-wrap items-center justify-between gap-3 text-xs select-none">
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary">Active Baseline:</span>
            <span className="font-semibold text-text px-2 py-0.5 rounded-control bg-surface-1 border border-separator font-mono">
              {baselineEncoding === 'o200k_base' ? 'o200k_base (OpenAI exact)' : 'cl100k_base (OpenAI exact)'}
            </span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-text-secondary">
            <span>
              Doc Tokens: <strong className="text-text tabular-nums">{baselineTokens.toLocaleString()}</strong>
            </span>
            <span>
              Ingested Tokens (with Overlap):{' '}
              <strong className="text-accent tabular-nums">{baselineChunkTokens.toLocaleString()}</strong>
            </span>
            <span>
              Chunks: <strong className="text-text tabular-nums">{chunks.length}</strong>
            </span>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="px-6 pt-3 border-b border-separator bg-surface-1/60 flex space-x-4 text-xs select-none">
          <button
            onClick={() => setActiveTab('tokens')}
            className={cn(
              'pb-3 font-medium flex items-center space-x-2 border-b-2 transition-colors active-press',
              activeTab === 'tokens'
                ? 'border-accent text-text'
                : 'border-transparent text-text-secondary hover:text-text'
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
                ? 'border-accent text-text'
                : 'border-transparent text-text-secondary hover:text-text'
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
                ? 'border-accent text-text'
                : 'border-transparent text-text-secondary hover:text-text'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Truncation Risk Guard</span>
            {comparison.truncationRisk.limit512Exceeded > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-mono bg-status-warn-subtle text-status-warn-text border border-status-warn/30">
                {comparison.truncationRisk.limit512Exceeded}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              <div className="border border-separator rounded-card overflow-hidden bg-surface-1 shadow-subtle">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-separator bg-surface-2/60 text-text-secondary font-mono text-xs">
                      <th className="py-2.5 px-3 font-semibold">Model / Provider</th>
                      <th className="py-2.5 px-3 font-semibold">Tokenizer Profile</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Doc Tokens</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Chunk Total</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Max Chunk</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Variance</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Chars/Tok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator font-mono">
                    {comparison.models.map((model) => {
                      const isBaseline =
                        (baselineEncoding === 'o200k_base' && model.id === 'gpt-4o') ||
                        (baselineEncoding === 'cl100k_base' && model.id === 'gpt-4');

                      return (
                        <tr
                          key={model.id}
                          className={cn(
                            'hover:bg-surface-2/40 transition-colors',
                            isBaseline && 'bg-accent-subtle/30'
                          )}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-sans font-medium text-text">{model.name}</span>
                              {model.isExact ? (
                                <span className="text-2xs px-1 py-0.2 rounded-control bg-status-success-subtle text-status-success-text border border-status-success/20 font-mono">
                                  Exact
                                </span>
                              ) : (
                                <span className="text-2xs px-1 py-0.2 rounded-control bg-surface-2 text-text-secondary border border-separator font-mono">
                                  Estimate
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary">{model.tokenizerName}</td>
                          <td className="py-2.5 px-3 text-right text-text tabular-nums">
                            {model.totalDocTokens.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-text tabular-nums">
                            {model.totalChunkTokens.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-text-secondary tabular-nums">
                            {model.maxChunkTokens}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isBaseline ? (
                              <span className="text-text-tertiary text-xs">Baseline (0%)</span>
                            ) : model.variancePercentVsBaseline > 0 ? (
                              <span className="inline-flex items-center space-x-0.5 text-status-warn-text font-medium tabular-nums">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>+{model.variancePercentVsBaseline}%</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-0.5 text-status-success-text font-medium tabular-nums">
                                <ArrowDownRight className="h-3 w-3" />
                                <span>{model.variancePercentVsBaseline}%</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-text-secondary tabular-nums">
                            {model.charsPerToken}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-text-secondary bg-surface-2/40 p-3 rounded-card border border-separator flex items-start space-x-2">
                <Scale className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text">Architecture Insight:</strong> Only the two OpenAI encodings (<code className="text-accent">o200k_base</code> and <code className="text-accent">cl100k_base</code>) are exact BPE encodings computed directly in-browser. Token counts for Claude, Gemini, Llama, and Cohere are estimates based on family tokenization characteristics.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 select-none">
                <span className="text-text font-medium">Vector Ingestion Cost Projections</span>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-text-secondary">Scale Projection:</span>
                  <select
                    value={customScaleDocs}
                    onChange={(e) => setCustomScaleDocs(Number(e.target.value))}
                    className="bg-surface-2 border border-separator text-text text-xs rounded-control px-2 py-1 focus-ring"
                  >
                    <option value={1000}>1,000 Docs</option>
                    <option value={10000}>10,000 Docs</option>
                    <option value={50000}>50,000 Docs</option>
                    <option value={100000}>100,000 Docs</option>
                    <option value={1000000}>1,000,000 Docs</option>
                  </select>
                </div>
              </div>

              <div className="border border-separator rounded-card overflow-hidden bg-surface-1 shadow-subtle">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-separator bg-surface-2/60 text-text-secondary font-mono text-xs">
                      <th className="py-2.5 px-3 font-semibold">Provider</th>
                      <th className="py-2.5 px-3 font-semibold">Embedding Model</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Rate / 1M Tokens</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Single Doc Cost</th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Scale ({customScaleDocs.toLocaleString()} Docs)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator font-mono">
                    {comparison.costs.map((cost) => {
                      const scaleCost = Number((cost.singleDocCost * customScaleDocs).toFixed(2));
                      return (
                        <tr key={cost.model} className="hover:bg-surface-2/40 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-medium text-text">{cost.provider}</td>
                          <td className="py-2.5 px-3 text-text-secondary">{cost.model}</td>
                          <td className="py-2.5 px-3 text-right text-text-tertiary tabular-nums">
                            ${cost.ratePerMillion.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-text tabular-nums">
                            {cost.singleDocCost < 0.0001 ? '< $0.0001' : `$${cost.singleDocCost.toFixed(5)}`}
                          </td>
                          <td className="py-2.5 px-3 text-right text-accent font-semibold tabular-nums">
                            ${scaleCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-text-secondary">
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
                    'p-4 rounded-card border text-xs shadow-subtle',
                    comparison.truncationRisk.limit512Exceeded > 0
                      ? 'bg-status-warn-subtle border-status-warn/30'
                      : 'bg-status-success-subtle border-status-success/20'
                  )}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-semibold text-text">512 Token Bound</span>
                    {comparison.truncationRisk.limit512Exceeded > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-status-warn" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-status-success" />
                    )}
                  </div>
                  <p className="text-text-secondary text-xs mt-1">
                    Applicable to: BERT, all-MiniLM-L6-v2, BGE-small, GTE-base
                  </p>
                  <div className="mt-3 font-mono">
                    {comparison.truncationRisk.limit512Exceeded > 0 ? (
                      <span className="text-status-warn-text font-semibold">
                        {comparison.truncationRisk.limit512Exceeded} chunk(s) breached
                      </span>
                    ) : (
                      <span className="text-status-success-text font-semibold">All chunks safe (100%)</span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'p-4 rounded-card border text-xs shadow-subtle',
                    comparison.truncationRisk.limit2048Exceeded > 0
                      ? 'bg-status-warn-subtle border-status-warn/30'
                      : 'bg-status-success-subtle border-status-success/20'
                  )}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-semibold text-text">2,048 Token Bound</span>
                    {comparison.truncationRisk.limit2048Exceeded > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-status-warn" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-status-success" />
                    )}
                  </div>
                  <p className="text-text-secondary text-xs mt-1">
                    Applicable to: Instructor-XL, Cohere Embed v2
                  </p>
                  <div className="mt-3 font-mono">
                    {comparison.truncationRisk.limit2048Exceeded > 0 ? (
                      <span className="text-status-warn-text font-semibold">
                        {comparison.truncationRisk.limit2048Exceeded} chunk(s) breached
                      </span>
                    ) : (
                      <span className="text-status-success-text font-semibold">All chunks safe (100%)</span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'p-4 rounded-card border text-xs shadow-subtle',
                    comparison.truncationRisk.limit8192Exceeded > 0
                      ? 'bg-status-error-subtle border-status-error/30'
                      : 'bg-status-success-subtle border-status-success/20'
                  )}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-semibold text-text">8,192 Token Bound</span>
                    {comparison.truncationRisk.limit8192Exceeded > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-status-error" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-status-success" />
                    )}
                  </div>
                  <p className="text-text-secondary text-xs mt-1">
                    Applicable to: OpenAI text-embedding-3, Voyage-3
                  </p>
                  <div className="mt-3 font-mono">
                    {comparison.truncationRisk.limit8192Exceeded > 0 ? (
                      <span className="text-status-error-text font-semibold">
                        {comparison.truncationRisk.limit8192Exceeded} chunk(s) breached
                      </span>
                    ) : (
                      <span className="text-status-success-text font-semibold">All chunks safe (100%)</span>
                    )}
                  </div>
                </div>
              </div>

              {comparison.truncationRisk.limit512Exceeded > 0 && (
                <div className="p-3 bg-surface-2 border border-separator rounded-card text-xs space-y-1.5 shadow-subtle">
                  <div className="flex items-center space-x-2 text-status-warn-text font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Silent Downstream Truncation Warning</span>
                  </div>
                  <p className="text-text-secondary text-xs">
                    The following chunk indices exceed 512 tokens:{' '}
                    <span className="font-mono text-status-warn-text font-semibold">
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
        <div className="px-6 py-3 border-t border-separator bg-surface-1/50 surface-translucent flex items-center justify-between text-xs">
          <span className="text-text-secondary font-mono text-xs">
            ChunkLens Multi-Model Engine • 100% Client-Side Ingestion Analysis
          </span>
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-control text-xs font-medium bg-surface-2 hover:bg-surface-3 border border-separator text-text active-press focus-ring transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
