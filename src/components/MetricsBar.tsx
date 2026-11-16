import React, { useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
        'border-b border-separator bg-surface-1/40 px-3 sm:px-4 py-2.5 select-none transition-all',
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
      {/* Desktop View (>=1280px): Metric Tiles Grid */}
      <div className="hidden xl:grid grid-cols-5 gap-2.5">
        {/* Tile 1: Chunks */}
        <div className="bg-surface-1 border border-separator rounded-card p-2.5 flex flex-col justify-between shadow-subtle transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <Tooltip content="Total chunk count created by current splitter strategy">
              <span className="cursor-help">Chunks</span>
            </Tooltip>
          </div>
          <div className="my-1">
            {isProcessing ? (
              <div className="h-6 w-12 bg-surface-2 animate-pulse rounded-control" />
            ) : (
              <span className="text-lg font-semibold text-text font-mono tabular-nums leading-none">
                {chunks.length}
              </span>
            )}
          </div>
          <span className="text-2xs text-text-tertiary font-mono">partitions</span>
        </div>

        {/* Tile 2: Ingested Tokens vs Document Tokens */}
        <div className="bg-surface-1 border border-separator rounded-card p-2.5 flex flex-col justify-between shadow-subtle transition-colors" data-testid="metric-tokens">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <Tooltip content="Ingested: total tokens ingested into vector store (overlap counted twice across adjacent chunks)">
              <span className="cursor-help underline decoration-dotted decoration-separator underline-offset-2">
                Ingested
              </span>
            </Tooltip>
          </div>
          <div className="my-1">
            {isProcessing ? (
              <div className="h-6 w-20 bg-surface-2 animate-pulse rounded-control" />
            ) : (
              <span className="text-lg font-semibold text-text font-mono tabular-nums leading-none" data-testid="ingested-tokens">
                {totalChunkTokens.toLocaleString()} tok
              </span>
            )}
          </div>
          <div className="text-2xs text-text-tertiary font-mono tabular-nums flex items-center space-x-1">
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
          </div>
        </div>

        {/* Tile 3: Avg per Chunk */}
        <div className="bg-surface-1 border border-separator rounded-card p-2.5 flex flex-col justify-between shadow-subtle transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <Tooltip content="Mean tokens per chunk and range [min–max]">
              <span className="cursor-help">Avg/Chunk</span>
            </Tooltip>
          </div>
          <div className="my-1">
            {isProcessing ? (
              <div className="h-6 w-14 bg-surface-2 animate-pulse rounded-control" />
            ) : (
              <span className="text-lg font-semibold text-text font-mono tabular-nums leading-none">
                {avgTokensPerChunk}
              </span>
            )}
          </div>
          <span className="text-2xs text-text-tertiary font-mono tabular-nums">
            [{minTokensPerChunk}–{maxTokensPerChunk}] tok
          </span>
        </div>

        {/* Tile 4: Vector Cost (Hero Metric) */}
        <div className="bg-surface-2/80 border border-separator/80 rounded-card p-2.5 flex flex-col justify-between shadow-subtle ring-1 ring-accent/20 transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <Tooltip content="Estimated embedding cost for total ingested tokens at $0.02 / 1M tokens (OpenAI text-embedding-3-small)">
              <span className="cursor-help text-text font-medium">Vector Cost</span>
            </Tooltip>
          </div>
          <div className="my-1">
            {isProcessing ? (
              <div className="h-6 w-16 bg-surface-3 animate-pulse rounded-control" />
            ) : (
              <span className="text-lg font-semibold text-accent font-mono tabular-nums leading-none">
                {costFormatted}
              </span>
            )}
          </div>
          <span className="text-2xs text-text-secondary font-mono">@ $0.02 / 1M tok</span>
        </div>

        {/* Tile 5: Execution Latency */}
        <div className="bg-surface-1 border border-separator rounded-card p-2.5 flex flex-col justify-between shadow-subtle transition-colors">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <Tooltip content="Time spent in Web Worker executing chunking and BPE tokenization">
              <span className="cursor-help">Compute</span>
            </Tooltip>
            {isProcessing && (
              <span
                role="status"
                aria-live="polite"
                className="text-2xs text-accent font-sans font-medium inline-flex items-center gap-1 shrink-0"
              >
                <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden="true" />
                <span>Computing...</span>
              </span>
            )}
          </div>
          <div className="my-1">
            {isProcessing ? (
              <div className="h-6 w-16 bg-surface-2 animate-pulse rounded-control" />
            ) : (
              <span className="text-lg font-semibold text-text font-mono tabular-nums leading-none">
                {executionTimeMs} ms
              </span>
            )}
          </div>
          <span className="text-2xs text-text-tertiary font-mono">Web Worker</span>
        </div>
      </div>

      {/* Responsive View (<1280px): Compact Tiles */}
      <div className="xl:hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
        {/* Metric 1: Chunks */}
        <div className="bg-surface-1 border border-separator rounded-card p-2 flex flex-col justify-between">
          <span className="text-2xs text-text-secondary font-medium">Chunks</span>
          <span className="text-base font-semibold text-text font-mono tabular-nums my-0.5">
            {chunks.length}
          </span>
          <span className="text-2xs text-text-tertiary font-mono">parts</span>
        </div>

        {/* Metric 2: Ingested & Doc Tokens */}
        <div className="bg-surface-1 border border-separator rounded-card p-2 flex flex-col justify-between" data-testid="mobile-metric-tokens">
          <span className="text-2xs text-text-secondary font-medium">Ingested</span>
          <span className="text-base font-semibold text-text font-mono tabular-nums my-0.5">
            {totalChunkTokens.toLocaleString()} tok
          </span>
          <span className="text-2xs text-text-tertiary font-mono tabular-nums truncate">
            ({totalTokens.toLocaleString()} doc)
          </span>
        </div>

        {/* Metric 3: Avg per Chunk */}
        <div className="bg-surface-1 border border-separator rounded-card p-2 flex flex-col justify-between">
          <span className="text-2xs text-text-secondary font-medium">Avg/Chunk</span>
          <span className="text-base font-semibold text-text font-mono tabular-nums my-0.5">
            {avgTokensPerChunk}
          </span>
          <span className="text-2xs text-text-tertiary font-mono tabular-nums">
            [{minTokensPerChunk}–{maxTokensPerChunk}]
          </span>
        </div>

        {/* Metric 4: Cost */}
        <div className="bg-surface-2/80 border border-separator/80 ring-1 ring-accent/20 rounded-card p-2 flex flex-col justify-between">
          <span className="text-2xs text-text font-medium">Cost</span>
          <span className="text-base font-semibold text-accent font-mono tabular-nums my-0.5">
            {costFormatted}
          </span>
          <span className="text-2xs text-text-secondary font-mono">est.</span>
        </div>

        {/* Metric 5: Latency */}
        <div className="bg-surface-1 border border-separator rounded-card p-2 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-text-secondary font-medium">Compute</span>
            {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
          </div>
          <span className="text-base font-semibold text-text font-mono tabular-nums my-0.5">
            {executionTimeMs} ms
          </span>
          <span className="text-2xs text-text-tertiary font-mono">worker</span>
        </div>
      </div>
    </div>
  );
};
