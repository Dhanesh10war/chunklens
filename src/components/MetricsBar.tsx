import React from 'react';
import { ChunkingResult } from '../engine/types';
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
          <span className="text-text-tertiary">Chunks</span>
          <span className="text-text-primary font-medium tabular-nums">{chunks.length}</span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 2: Ingested Tokens */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-tertiary">Ingested</span>
          <span className="text-text-primary font-medium tabular-nums">{totalChunkTokens.toLocaleString()} tok</span>
          <span className="text-text-tertiary text-[11px] tabular-nums hidden md:inline">
            ({totalTokens.toLocaleString()} doc / {totalChars.toLocaleString()} ch)
          </span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 3: Avg per Chunk */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-tertiary">Avg/Chunk</span>
          <span className="text-text-primary font-medium tabular-nums">{avgTokensPerChunk}</span>
          <span className="text-text-tertiary text-[11px] tabular-nums hidden sm:inline">
            [{minTokensPerChunk}–{maxTokensPerChunk}]
          </span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 4: Est. Vector Cost */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-tertiary">Vector Cost</span>
          <span className="text-text-primary font-medium tabular-nums">{costFormatted}</span>
        </div>

        <span className="text-border-default">|</span>

        {/* Metric 5: Execution Latency */}
        <div className="flex items-center space-x-1.5">
          <span className="text-text-tertiary">Compute</span>
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
