import React from 'react';
import { ChunkingResult } from '../engine/types';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';

interface MetricsBarProps {
  result: ChunkingResult;
  isProcessing?: boolean;
  onOpenTokenizerModal?: () => void;
  className?: string;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  result,
  isProcessing = false,
  onOpenTokenizerModal,
  className,
}) => {
  const {
    chunks,
    totalTokens,
    totalChunkTokens,
    totalChars,
    avgTokensPerChunk,
    minTokensPerChunk,
    maxTokensPerChunk,
    estimatedCostUsd,
    executionTimeMs,
  } = result;

  const costFormatted =
    estimatedCostUsd < 0.0001 ? '< $0.0001' : `$${estimatedCostUsd.toFixed(4)}`;

  return (
    <div
      className={cn(
        'h-9 border-b border-border-default bg-surface/50 px-4 sm:px-6 flex items-center justify-between text-xs font-mono select-none overflow-x-auto',
        className
      )}
    >
      {/* Inline Label/Value Pairs with Hairline Dividers */}
      <div className="flex items-center space-x-3 sm:space-x-4 text-text-secondary whitespace-nowrap">
        {/* Metric 1: Chunks */}
        <div className="flex items-center space-x-1.5">
          <Tooltip content="Total chunk count created by current splitter strategy">
            <span className="text-text-tertiary cursor-help">Chunks</span>
          </Tooltip>
          <span className="text-text-primary font-medium tabular-nums">{chunks.length}</span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 2: Ingested Tokens vs Document Tokens */}
        <div className="flex items-center space-x-1.5" data-testid="metric-tokens">
          <Tooltip content="Ingested: total tokens ingested into vector store (overlap counted twice across adjacent chunks)">
            <span className="text-text-tertiary cursor-help underline decoration-dotted decoration-border-default underline-offset-2">
              Ingested
            </span>
          </Tooltip>
          <span className="text-text-primary font-medium tabular-nums" data-testid="ingested-tokens">
            {totalChunkTokens.toLocaleString()} tok
          </span>
          <span className="text-text-tertiary text-[11px] tabular-nums hidden md:inline-flex items-center space-x-1">
            <span>(</span>
            <Tooltip content="Document: unique tokens in source text without chunk overlap">
              <span className="cursor-help hover:text-text-secondary" data-testid="document-tokens">
                {totalTokens.toLocaleString()} doc
              </span>
            </Tooltip>
            <span>/</span>
            <Tooltip content="Document characters: exact character count of raw document text">
              <span className="cursor-help hover:text-text-secondary" data-testid="document-chars">
                {totalChars.toLocaleString()} ch
              </span>
            </Tooltip>
            <span>)</span>
          </span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 3: Avg per Chunk */}
        <div className="flex items-center space-x-1.5">
          <Tooltip content="Mean tokens per chunk and range [min–max]">
            <span className="text-text-tertiary cursor-help">Avg/Chunk</span>
          </Tooltip>
          <span className="text-text-primary font-medium tabular-nums">{avgTokensPerChunk}</span>
          <span className="text-text-tertiary text-[11px] tabular-nums hidden sm:inline">
            [{minTokensPerChunk}–{maxTokensPerChunk}]
          </span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 4: Est. Vector Cost */}
        <div className="flex items-center space-x-1.5">
          <Tooltip content="Estimated embedding cost for total ingested tokens at $0.02 / 1M tokens (OpenAI text-embedding-3-small)">
            <span className="text-text-tertiary cursor-help">Vector Cost</span>
          </Tooltip>
          <span className="text-text-primary font-medium tabular-nums">{costFormatted}</span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 5: Execution Latency */}
        <div className="flex items-center space-x-1.5">
          <Tooltip content="Time spent in Web Worker executing chunking and BPE tokenization">
            <span className="text-text-tertiary cursor-help">Compute</span>
          </Tooltip>
          <span className="text-text-primary font-medium tabular-nums">{executionTimeMs} ms</span>
          {isProcessing && (
            <span className="text-[10px] text-accent animate-pulse font-sans font-medium">
              (Worker computing...)
            </span>
          )}
        </div>
      </div>

      {/* Right: Compare Tokenizers Trigger */}
      {onOpenTokenizerModal && (
        <button
          onClick={onOpenTokenizerModal}
          className="text-text-tertiary hover:text-text-primary hover:underline text-[11px] font-mono whitespace-nowrap ml-4 transition-colors focus-ring rounded"
        >
          Compare Tokenizers →
        </button>
      )}
    </div>
  );
};
