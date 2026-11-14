import React, { useRef, useState, useEffect } from 'react';
import { ChunkingResult } from '../engine/types';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';

interface MetricsBarProps {
  result: ChunkingResult;
  isProcessing?: boolean;
  className?: string;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  result,
  isProcessing = false,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const { scrollWidth, clientWidth } = containerRef.current;
        setHasOverflow(scrollWidth > clientWidth + 2);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [result]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'border-b border-border-default bg-surface/50 text-xs font-mono select-none transition-all',
        className
      )}
      style={
        hasOverflow
          ? {
              maskImage: 'linear-gradient(to right, black calc(100% - 28px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 28px), transparent)',
            }
          : undefined
      }
    >
      {/* Desktop View (>=1280px): Single Horizontal Strip */}
      <div className="hidden xl:flex h-9 px-4 sm:px-6 items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-3 sm:space-x-4 text-text-secondary whitespace-nowrap">
          {/* Metric 1: Chunks */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Tooltip content="Total chunk count created by current splitter strategy">
              <span className="text-text-tertiary cursor-help">Chunks</span>
            </Tooltip>
            <span className="text-text-primary font-medium tabular-nums">{chunks.length}</span>
          </div>

          <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

          {/* Metric 2: Ingested Tokens vs Document Tokens */}
          <div className="flex items-center space-x-1.5 shrink-0" data-testid="metric-tokens">
            <Tooltip content="Ingested: total tokens ingested into vector store (overlap counted twice across adjacent chunks)">
              <span className="text-text-tertiary cursor-help underline decoration-dotted decoration-border-default underline-offset-2">
                Ingested
              </span>
            </Tooltip>
            <span className="text-text-primary font-medium tabular-nums" data-testid="ingested-tokens">
              {totalChunkTokens.toLocaleString()} tok
            </span>
            <span className="text-text-tertiary text-xs tabular-nums hidden lg:inline-flex items-center space-x-1">
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

          <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

          {/* Metric 3: Avg per Chunk */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Tooltip content="Mean tokens per chunk and range [min–max]">
              <span className="text-text-tertiary cursor-help">Avg/Chunk</span>
            </Tooltip>
            <span className="text-text-primary font-medium tabular-nums">{avgTokensPerChunk}</span>
            <span className="text-text-tertiary text-xs tabular-nums hidden sm:inline">
              [{minTokensPerChunk}–{maxTokensPerChunk}]
            </span>
          </div>

          <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

          {/* Metric 4: Est. Vector Cost */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Tooltip content="Estimated embedding cost for total ingested tokens at $0.02 / 1M tokens (OpenAI text-embedding-3-small)">
              <span className="text-text-tertiary cursor-help">Vector Cost</span>
            </Tooltip>
            <span className="text-text-primary font-medium tabular-nums">{costFormatted}</span>
          </div>

          <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

          {/* Metric 5: Execution Latency */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Tooltip content="Time spent in Web Worker executing chunking and BPE tokenization">
              <span className="text-text-tertiary cursor-help">Compute</span>
            </Tooltip>
            <span className="text-text-primary font-medium tabular-nums">{executionTimeMs} ms</span>
            {isProcessing && (
              <span className="text-xs text-accent animate-pulse font-sans font-medium">
                (Worker computing...)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Responsive View (<1280px): Compact Left-Aligned Wrapped Rows */}
      <div className="xl:hidden px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-start gap-x-3 gap-y-1 text-xs text-text-secondary">
        {/* Metric 1: Chunks */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-text-tertiary">Chunks</span>
          <span className="text-text-primary font-medium tabular-nums">{chunks.length}</span>
        </div>

        <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

        {/* Metric 2: Ingested & Doc Tokens */}
        <div className="flex items-center space-x-1.5 shrink-0" data-testid="mobile-metric-tokens">
          <span className="text-text-tertiary">Ingested</span>
          <span className="text-text-primary font-medium tabular-nums">
            {totalChunkTokens.toLocaleString()} tok
          </span>
          <span className="text-text-tertiary text-xs">
            ({totalTokens.toLocaleString()} doc)
          </span>
        </div>

        <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

        {/* Metric 3: Avg per Chunk */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-text-tertiary">Avg</span>
          <span className="text-text-primary font-medium tabular-nums">{avgTokensPerChunk}</span>
          <span className="text-text-tertiary text-xs tabular-nums">[{minTokensPerChunk}–{maxTokensPerChunk}]</span>
        </div>

        <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

        {/* Metric 4: Cost */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-text-tertiary">Cost</span>
          <span className="text-text-primary font-medium tabular-nums">{costFormatted}</span>
        </div>

        <span className="border-l border-border-subtle h-3.5 shrink-0" aria-hidden="true" />

        {/* Metric 5: Latency */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="text-text-tertiary">Compute</span>
          <span className="text-text-primary font-medium tabular-nums">{executionTimeMs} ms</span>
        </div>
      </div>
    </div>
  );
};
