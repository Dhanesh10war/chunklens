import React, { useState } from 'react';
import { ChunkingConfig, ChunkingStrategy, ChunkUnit, TokenizerEncoding } from '../engine/types';
import { executeChunking } from '../engine/chunkers';
import { SplitSquareVertical, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface ComparisonViewProps {
  primaryConfig: ChunkingConfig;
  rawText: string;
  onApplyVariantB?: (config: ChunkingConfig) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ primaryConfig, rawText, onApplyVariantB }) => {
  // Strategy B secondary configuration
  const [secondaryConfig, setSecondaryConfig] = useState<ChunkingConfig>({
    strategy: 'markdown',
    chunkSize: primaryConfig.unit === 'tokens' ? 400 : 1000,
    chunkOverlap: primaryConfig.unit === 'tokens' ? 40 : 100,
    unit: primaryConfig.unit,
    encoding: primaryConfig.encoding,
  });

  const resultA = executeChunking(rawText, primaryConfig);
  const resultB = executeChunking(rawText, secondaryConfig);

  const handleUnitToggle = (unit: ChunkUnit) => {
    const newChunkSize = unit === 'tokens' ? Math.min(500, secondaryConfig.chunkSize) : Math.max(800, secondaryConfig.chunkSize * 4);
    const newOverlap = unit === 'tokens' ? Math.min(50, secondaryConfig.chunkOverlap) : Math.max(100, secondaryConfig.chunkOverlap * 4);
    setSecondaryConfig({
      ...secondaryConfig,
      unit,
      chunkSize: newChunkSize,
      chunkOverlap: newOverlap,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-2 border-b border-border bg-panel flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <SplitSquareVertical className="h-4 w-4 text-primary-400" />
          <span className="font-semibold text-white">Side-by-Side Strategy Benchmark</span>
        </div>

        {/* Secondary Strategy Controller */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono font-medium">Variant B:</span>
          <select
            value={secondaryConfig.strategy}
            onChange={(e) =>
              setSecondaryConfig({
                ...secondaryConfig,
                strategy: e.target.value as ChunkingStrategy,
              })
            }
            className="h-7 bg-canvas border border-border rounded px-2 text-slate-200 text-xs focus-ring hover:border-border-hover transition-colors"
          >
            <option value="tabular">Tabular &amp; CSV</option>
            <option value="markdown">Markdown AST</option>
            <option value="sentence">Sentence Boundary</option>
            <option value="recursive">Recursive Character</option>
            <option value="fixed">Fixed Window</option>
          </select>

          {/* Unit Toggle */}
          <div className="flex h-7 bg-canvas p-0.5 rounded border border-border">
            <button
              onClick={() => handleUnitToggle('tokens')}
              className={cn(
                'px-2 text-[11px] rounded active-press focus-ring transition-colors',
                secondaryConfig.unit === 'tokens' ? 'bg-primary-600/30 text-primary-200 font-semibold border border-primary-500/30' : 'text-slate-400'
              )}
            >
              Tok
            </button>
            <button
              onClick={() => handleUnitToggle('characters')}
              className={cn(
                'px-2 text-[11px] rounded active-press focus-ring transition-colors',
                secondaryConfig.unit === 'characters' ? 'bg-primary-600/30 text-primary-200 font-semibold border border-primary-500/30' : 'text-slate-400'
              )}
            >
              Ch
            </button>
          </div>

          <span className="text-slate-400">Size:</span>
          <input
            type="number"
            value={secondaryConfig.chunkSize}
            onChange={(e) => {
              const newSize = parseInt(e.target.value, 10) || 100;
              setSecondaryConfig({
                ...secondaryConfig,
                chunkSize: newSize,
                chunkOverlap: Math.min(secondaryConfig.chunkOverlap, Math.floor(newSize * 0.5)),
              });
            }}
            className="w-16 h-7 bg-canvas border border-border rounded px-1.5 text-slate-200 text-xs font-mono tabular-nums focus-ring hover:border-border-hover"
          />

          <span className="text-slate-400">Overlap:</span>
          <input
            type="number"
            value={secondaryConfig.chunkOverlap}
            onChange={(e) => {
              const maxOverlap = Math.floor(secondaryConfig.chunkSize * 0.5);
              const requested = parseInt(e.target.value, 10) || 0;
              setSecondaryConfig({
                ...secondaryConfig,
                chunkOverlap: Math.min(requested, maxOverlap),
              });
            }}
            className="w-14 h-7 bg-canvas border border-border rounded px-1.5 text-slate-200 text-xs font-mono tabular-nums focus-ring hover:border-border-hover"
          />

          <select
            value={secondaryConfig.encoding}
            onChange={(e) =>
              setSecondaryConfig({
                ...secondaryConfig,
                encoding: e.target.value as TokenizerEncoding,
              })
            }
            className="h-7 bg-canvas border border-border rounded px-1.5 text-slate-200 text-[11px] focus-ring hover:border-border-hover"
          >
            <option value="o200k_base">o200k</option>
            <option value="cl100k_base">cl100k</option>
          </select>
        </div>
      </div>

      {/* Split Comparison Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
        {/* Panel A */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-panel border-b border-border flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-primary-400 uppercase tracking-wide">
              Variant A: {primaryConfig.strategy} ({primaryConfig.chunkSize} {primaryConfig.unit})
            </span>
            <div className="flex items-center space-x-3 text-slate-400 tabular-nums">
              <span>{resultA.chunks.length} chunks</span>
              <span>avg {resultA.avgTokensPerChunk} tok</span>
              <span className="text-emerald-400">{resultA.executionTimeMs} ms</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {resultA.chunks.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-lg border border-border bg-surface hover:border-border-hover transition-colors shadow-subtle"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-white/5">
                  <span className="text-primary-300 font-bold tabular-nums">#{c.index + 1}</span>
                  {c.sectionHeader && <span className="text-slate-300 truncate max-w-[140px]">[{c.sectionHeader}]</span>}
                  <span className="tabular-nums">{c.tokenCount} tokens ({c.charCount} chars)</span>
                </div>
                <p className="text-[13px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel B */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-panel border-b border-border flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-accent-cyan uppercase tracking-wide">
              Variant B: {secondaryConfig.strategy} ({secondaryConfig.chunkSize} {secondaryConfig.unit})
            </span>
            <div className="flex items-center space-x-2 text-slate-400 tabular-nums">
              <span>{resultB.chunks.length} chunks</span>
              <span>avg {resultB.avgTokensPerChunk} tok</span>
              <span className="text-emerald-400">{resultB.executionTimeMs} ms</span>
              {onApplyVariantB && (
                <button
                  onClick={() => onApplyVariantB(secondaryConfig)}
                  className="h-6 flex items-center space-x-1 px-2.5 rounded bg-primary-600/20 border border-primary-500/40 text-primary-300 hover:bg-primary-600/30 text-xs font-sans font-medium active-press focus-ring transition-colors ml-2"
                  title="Apply Variant B parameters as the active primary configuration"
                >
                  <Check className="h-3 w-3" />
                  <span>Apply as Active</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {resultB.chunks.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-lg border border-border bg-surface hover:border-border-hover transition-colors shadow-subtle"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-white/5">
                  <span className="text-accent-cyan font-bold tabular-nums">#{c.index + 1}</span>
                  {c.sectionHeader && <span className="text-slate-300 truncate max-w-[140px]">[{c.sectionHeader}]</span>}
                  <span className="tabular-nums">{c.tokenCount} tokens ({c.charCount} chars)</span>
                </div>
                <p className="text-[13px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
