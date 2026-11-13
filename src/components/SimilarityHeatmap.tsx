import React, { useState, useMemo } from 'react';
import { ChunkMetadata } from '../engine/types';
import { computeChunkSimilarityMatrix, RedundantPair } from '../engine/embeddings/vectorizer';
import { Layers, AlertTriangle, ArrowRight, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface SimilarityHeatmapProps {
  chunks: ChunkMetadata[];
}

export const SimilarityHeatmap: React.FC<SimilarityHeatmapProps> = ({ chunks }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // Compute similarity matrix and metrics
  const similarityData = useMemo(() => {
    return computeChunkSimilarityMatrix(chunks, 0.70);
  }, [chunks]);

  const { matrix, adjacentSimilarities, averageContinuity, redundantPairs, sharedKeywordsMatrix } =
    similarityData;

  const N = chunks.length;

  if (N === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-canvas">
        <Layers className="h-10 w-10 text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">No Chunks Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Upload or select a corpus to compute the semantic similarity heatmap and boundary continuity matrix.
        </p>
      </div>
    );
  }

  // Selected pair details for side inspector
  const activePair = selectedCell
    ? {
        chunkA: chunks[selectedCell.row],
        chunkB: chunks[selectedCell.col],
        score: matrix[selectedCell.row]?.[selectedCell.col] ?? 0,
        sharedKeywords: sharedKeywordsMatrix[`${selectedCell.row}-${selectedCell.col}`] || [],
        row: selectedCell.row,
        col: selectedCell.col,
      }
    : null;

  const getScoreColor = (score: number, isSelf: boolean) => {
    if (isSelf) return 'bg-primary-600/70 text-white font-semibold border-primary-500/50';
    if (score >= 0.7) return 'bg-emerald-500/40 text-emerald-200 border-emerald-500/40 font-medium';
    if (score >= 0.4) return 'bg-blue-600/30 text-blue-200 border-blue-500/30';
    if (score >= 0.15) return 'bg-surface text-slate-300 border-border';
    if (score > 0) return 'bg-canvas text-slate-500 border-border/50';
    return 'bg-canvas text-slate-700 border-border/30';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-canvas">
      {/* Metric Highlights Bar */}
      <div className="px-6 py-3 border-b border-border bg-panel flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-6">
          {/* Average Continuity */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Boundary Continuity:</span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums px-2 py-0.5 rounded text-xs border',
                averageContinuity >= 0.4
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : averageContinuity >= 0.2
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              )}
            >
              {(averageContinuity * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">
              {averageContinuity >= 0.4
                ? '(High semantic flow)'
                : averageContinuity >= 0.2
                ? '(Moderate flow)'
                : '(Context fragmented)'}
            </span>
          </div>

          {/* Redundancy Counter */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">High Overlap (&gt;70%):</span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums px-2 py-0.5 rounded text-xs border',
                redundantPairs.length > 0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-surface text-slate-400 border-border'
              )}
            >
              {redundantPairs.length} {redundantPairs.length === 1 ? 'pair' : 'pairs'}
            </span>
          </div>

          {/* Matrix Dimension */}
          <div className="flex items-center space-x-2 text-slate-500 font-mono text-xs">
            <span>Matrix:</span>
            <span className="text-slate-400 tabular-nums">
              {N} × {N} ({N * N} cells)
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary-600/70 border border-primary-500/50" />
            <span>Self</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/40" />
            <span>High (&ge;70%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-600/30 border border-blue-500/30" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-canvas border border-border" />
            <span>Low / None</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Heatmap Grid & Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Heatmap Matrix Grid Container */}
        <div className="flex-1 overflow-auto p-6 flex flex-col">
          <div className="inline-block min-w-full">
            {/* Top Column Index Header */}
            <div className="flex items-center mb-1 pl-12">
              {chunks.map((_, colIdx) => (
                <div
                  key={`col-head-${colIdx}`}
                  className="w-10 text-center font-mono text-xs text-slate-500 shrink-0 select-none tabular-nums"
                  title={`Chunk #${colIdx + 1}`}
                >
                  #{colIdx + 1}
                </div>
              ))}
            </div>

            {/* Heatmap Rows */}
            <div className="space-y-1">
              {matrix.map((rowScores, rowIdx) => (
                <div key={`row-${rowIdx}`} className="flex items-center">
                  {/* Row Index Label */}
                  <div
                    className="w-12 text-right pr-2 font-mono text-xs text-slate-500 shrink-0 select-none tabular-nums"
                    title={`Chunk #${rowIdx + 1}`}
                  >
                    #{rowIdx + 1}
                  </div>

                  {/* Row Cells */}
                  <div className="flex items-center space-x-1">
                    {rowScores.map((score, colIdx) => {
                      const isSelf = rowIdx === colIdx;
                      const isSelected =
                        selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                      const isAdjacent = Math.abs(rowIdx - colIdx) === 1;

                      return (
                        <button
                          key={`cell-${rowIdx}-${colIdx}`}
                          onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                          title={`Chunk #${rowIdx + 1} ↔ Chunk #${colIdx + 1}: ${(score * 100).toFixed(0)}% similarity${
                            isAdjacent ? ' (Adjacent boundary)' : ''
                          }`}
                          className={cn(
                            'w-10 h-8 rounded-sm text-xs font-mono border flex items-center justify-center transition-all select-none active-press focus-ring tabular-nums',
                            getScoreColor(score, isSelf),
                            isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-canvas z-10',
                            isAdjacent && !isSelf && 'border-dashed'
                          )}
                        >
                          {(score * 100).toFixed(0)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adjacent Continuity Stepper Track */}
          {adjacentSimilarities.length > 0 && (
            <div className="mt-8 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary-400" />
                Sequential Chunk Transition Continuity:
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {adjacentSimilarities.map((score, idx) => (
                  <button
                    key={`adj-${idx}`}
                    onClick={() => setSelectedCell({ row: idx, col: idx + 1 })}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-mono border flex items-center space-x-1.5 active-press focus-ring transition-colors',
                      selectedCell?.row === idx && selectedCell?.col === idx + 1
                        ? 'border-primary text-white bg-primary-600/30'
                        : 'bg-surface text-slate-300 border-border hover:border-border-hover'
                    )}
                  >
                    <span className="text-slate-400">#{idx + 1}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-400">#{idx + 2}:</span>
                    <span
                      className={cn(
                        'tabular-nums font-semibold',
                        score >= 0.4
                          ? 'text-emerald-400'
                          : score >= 0.2
                          ? 'text-blue-400'
                          : 'text-amber-400'
                      )}
                    >
                      {(score * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Redundancy Alerts Box */}
          {redundantPairs.length > 0 && (
            <div className="mt-6 p-3.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold mb-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Detected {redundantPairs.length} High-Similarity Chunk Pair(s) (&gt;70%)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                {redundantPairs.map((pair: RedundantPair, idx: number) => (
                  <li
                    key={`alert-${idx}`}
                    className="flex flex-wrap items-center gap-2 font-mono text-xs"
                  >
                    <button
                      onClick={() =>
                        setSelectedCell({ row: pair.chunkAIndex, col: pair.chunkBIndex })
                      }
                      className="underline text-amber-400 hover:text-amber-300"
                    >
                      Chunk #{pair.chunkAIndex + 1} &amp; Chunk #{pair.chunkBIndex + 1}
                    </button>
                    <span className="text-slate-400">({(pair.similarity * 100).toFixed(0)}% match)</span>
                    {pair.sharedKeywords.length > 0 && (
                      <span className="text-slate-400 text-xs">
                        Shared: {pair.sharedKeywords.join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Selected Pair Deep Comparison Drawer */}
        {activePair && (
          <div className="w-96 border-l border-border bg-panel flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Chunk #{activePair.row + 1} ↔ Chunk #{activePair.col + 1} Comparison
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-xs font-semibold text-primary-400 tabular-nums">
                    {(activePair.score * 100).toFixed(1)}% Cosine Similarity
                  </span>
                  {activePair.row === activePair.col && (
                    <span className="text-xs text-slate-400 font-mono">(Self)</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-subtle active-press focus-ring transition-colors"
                aria-label="Close pair inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shared Keywords Pills */}
            {activePair.sharedKeywords.length > 0 && (
              <div className="p-3 border-b border-border bg-panel">
                <span className="text-xs font-medium text-slate-400 block mb-1.5">
                  Top Shared Distinctive Terms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activePair.sharedKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded text-xs font-mono bg-primary-500/10 text-primary-300 border border-primary-500/30"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Side-by-Side Chunk Content Previews */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Chunk A */}
              <div className="p-3 rounded-md bg-canvas border border-border">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400 font-mono">
                  <span className="text-white font-semibold">Chunk #{activePair.row + 1}</span>
                  <span className="tabular-nums">
                    {activePair.chunkA.tokenCount} tok • {activePair.chunkA.charCount} ch
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {activePair.chunkA.text}
                </div>
              </div>

              {/* Chunk B */}
              <div className="p-3 rounded-md bg-canvas border border-border">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400 font-mono">
                  <span className="text-white font-semibold">Chunk #{activePair.col + 1}</span>
                  <span className="tabular-nums">
                    {activePair.chunkB.tokenCount} tok • {activePair.chunkB.charCount} ch
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {activePair.chunkB.text}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
