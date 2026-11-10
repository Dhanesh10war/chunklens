import React, { useState } from 'react';
import { ChunkingConfig, ChunkingStrategy } from '../engine/types';
import { executeChunking } from '../engine/chunkers';
import { SplitSquareVertical } from 'lucide-react';

interface ComparisonViewProps {
  primaryConfig: ChunkingConfig;
  rawText: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ primaryConfig, rawText }) => {
  // Strategy B secondary configuration
  const [secondaryConfig, setSecondaryConfig] = useState<ChunkingConfig>({
    strategy: 'markdown',
    chunkSize: 600,
    chunkOverlap: 60,
    unit: 'tokens',
    encoding: 'o200k_base',
  });

  const resultA = executeChunking(rawText, primaryConfig);
  const resultB = executeChunking(rawText, secondaryConfig);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-surface/50 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <SplitSquareVertical className="h-4 w-4 text-primary-400" />
          <span className="font-semibold text-white">Side-by-Side Strategy Benchmark</span>
        </div>

        {/* Secondary Strategy Controller */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400">Variant B:</span>
          <select
            value={secondaryConfig.strategy}
            onChange={(e) =>
              setSecondaryConfig({
                ...secondaryConfig,
                strategy: e.target.value as ChunkingStrategy,
              })
            }
            className="bg-[#090d16] border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
          >
            <option value="markdown">Markdown AST</option>
            <option value="sentence">Sentence Boundary</option>
            <option value="recursive">Recursive Character</option>
            <option value="fixed">Fixed Window</option>
          </select>

          <span className="text-slate-400">Size:</span>
          <input
            type="number"
            value={secondaryConfig.chunkSize}
            onChange={(e) =>
              setSecondaryConfig({
                ...secondaryConfig,
                chunkSize: parseInt(e.target.value, 10) || 500,
              })
            }
            className="w-16 bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
          />
        </div>
      </div>

      {/* Split Comparison Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
        {/* Panel A */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-surface border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-primary-400 uppercase">
              Variant A: {primaryConfig.strategy} ({primaryConfig.chunkSize} {primaryConfig.unit})
            </span>
            <div className="flex items-center space-x-3 text-slate-400">
              <span>{resultA.chunks.length} chunks</span>
              <span>avg {resultA.avgTokensPerChunk} tok</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {resultA.chunks.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg border border-slate-800 bg-surface/40 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-slate-800">
                  <span className="text-primary-300 font-bold">#{c.index + 1}</span>
                  <span>{c.tokenCount} tokens ({c.charCount} chars)</span>
                </div>
                <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel B */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-surface border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-accent-cyan uppercase">
              Variant B: {secondaryConfig.strategy} ({secondaryConfig.chunkSize} {secondaryConfig.unit})
            </span>
            <div className="flex items-center space-x-3 text-slate-400">
              <span>{resultB.chunks.length} chunks</span>
              <span>avg {resultB.avgTokensPerChunk} tok</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {resultB.chunks.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-lg border border-slate-800 bg-surface/40 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-slate-800">
                  <span className="text-accent-cyan font-bold">#{c.index + 1}</span>
                  <span>{c.tokenCount} tokens ({c.charCount} chars)</span>
                </div>
                <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
