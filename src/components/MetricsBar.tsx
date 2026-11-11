import React from 'react';
import { ChunkingResult } from '../engine/types';
import { Layers, Hash, Activity, Clock, DollarSign, AlertCircle } from 'lucide-react';

interface MetricsBarProps {
  result: ChunkingResult;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ result }) => {
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
    <div className="bg-panel border-b border-border px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs font-mono">
        {/* Metric 1: Total Chunks */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Chunks: </span>
            <span className="text-white font-semibold tabular-nums">{chunks.length}</span>
          </div>
        </div>

        {/* Metric 2: Ingested & Source Tokens */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
            <Hash className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Ingested Tokens: </span>
            <span className="text-white font-semibold tabular-nums">{totalChunkTokens.toLocaleString()}</span>
            <span className="text-slate-400/80 text-[11px] ml-1 tabular-nums" title="Tokens in source text">
              (Doc: {totalTokens.toLocaleString()} tok / {totalChars.toLocaleString()} ch)
            </span>
          </div>
        </div>

        {/* Metric 3: Avg Tokens / Chunk */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Avg Tokens/Chunk: </span>
            <span className="text-white font-semibold tabular-nums">{avgTokensPerChunk}</span>
            <span className="text-slate-400/80 text-[11px] ml-1 tabular-nums">
              [{minTokensPerChunk} – {maxTokensPerChunk}]
            </span>
          </div>
        </div>

        {/* Metric 4: Embedding Cost Estimate */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Vector Cost: </span>
            <span className="text-accent-amber font-semibold tabular-nums">{costFormatted}</span>
          </div>
        </div>

        {/* Metric 5: Runtime Latency */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-surface text-slate-400 border border-border">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Execution: </span>
            <span className="text-emerald-400 font-semibold tabular-nums">{executionTimeMs} ms</span>
          </div>
        </div>

        {/* Warning if any chunk is oversized */}
        {maxTokensPerChunk > 1024 && (
          <div className="flex items-center space-x-1.5 text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tabular-nums">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Chunk &gt; 1,024 tokens</span>
          </div>
        )}
      </div>
    </div>
  );
};
