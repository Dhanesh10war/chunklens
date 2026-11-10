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
    <div className="bg-[#0b101d] border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs font-mono">
        {/* Metric 1: Total Chunks */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-primary-500/10 text-primary-400">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Chunks: </span>
            <span className="text-white font-semibold">{chunks.length}</span>
          </div>
        </div>

        {/* Metric 2: Total Tokens */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-accent-cyan/10 text-accent-cyan">
            <Hash className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Total Tokens: </span>
            <span className="text-white font-semibold">{totalTokens.toLocaleString()}</span>
            <span className="text-slate-500 text-[10px] ml-1">({totalChars.toLocaleString()} chars)</span>
          </div>
        </div>

        {/* Metric 3: Avg Tokens / Chunk */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-accent-emerald/10 text-accent-emerald">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Avg Tokens/Chunk: </span>
            <span className="text-white font-semibold">{avgTokensPerChunk}</span>
            <span className="text-slate-500 text-[10px] ml-1">
              [{minTokensPerChunk} – {maxTokensPerChunk}]
            </span>
          </div>
        </div>

        {/* Metric 4: Embedding Cost Estimate */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-accent-amber/10 text-accent-amber">
            <DollarSign className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Vector Cost: </span>
            <span className="text-accent-amber font-semibold">{costFormatted}</span>
          </div>
        </div>

        {/* Metric 5: Runtime Latency */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-slate-800 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-slate-400">Execution: </span>
            <span className="text-emerald-400 font-semibold">{executionTimeMs} ms</span>
          </div>
        </div>

        {/* Warning if any chunk is large */}
        {maxTokensPerChunk > 1024 && (
          <div className="flex items-center space-x-1 text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <AlertCircle className="h-3 w-3" />
            <span>Chunk &gt; 1,024 tokens</span>
          </div>
        )}
      </div>
    </div>
  );
};
