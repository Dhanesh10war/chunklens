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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary bg-bg">
        <Layers className="h-10 w-10 text-text-tertiary mb-3" />
        <h3 className="text-sm font-semibold text-text">No Chunks Available</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1">
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
    if (isSelf) return 'bg-accent text-white font-semibold border-accent/40 shadow-subtle';
    if (score >= 0.7) return 'bg-accent/35 text-text font-medium border-accent/40';
    if (score >= 0.4) return 'bg-accent/20 text-text border-accent/25';
    if (score >= 0.15) return 'bg-accent/10 text-text-secondary border-separator';
    if (score > 0) return 'bg-surface-2/60 text-text-tertiary border-separator/40';
    return 'bg-surface-1/40 text-text-tertiary/60 border-separator/20';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg text-text">
      {/* Metric Highlights Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-separator bg-surface-1/40 mac-translucent flex flex-wrap items-center justify-between gap-4 text-xs select-none">
        <div className="flex items-center space-x-4 sm:space-x-6 flex-wrap gap-y-2">
          {/* Average Continuity */}
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary">Boundary Continuity:</span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums px-2 py-0.5 rounded-control text-xs border',
                averageContinuity >= 0.4
                  ? 'bg-status-success-subtle text-status-success-text border-status-success/30'
                  : averageContinuity >= 0.2
                  ? 'bg-accent-subtle text-accent border-accent/30'
                  : 'bg-status-warn-subtle text-status-warn-text border-status-warn/30'
              )}
            >
              {(averageContinuity * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-text-tertiary">
              {averageContinuity >= 0.4
                ? '(High semantic flow)'
                : averageContinuity >= 0.2
                ? '(Moderate flow)'
                : '(Context fragmented)'}
            </span>
          </div>

          {/* Redundancy Counter */}
          <div className="flex items-center space-x-2">
            <span className="text-text-secondary">High Overlap (&gt;70%):</span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums px-2 py-0.5 rounded-control text-xs border',
                redundantPairs.length > 0
                  ? 'bg-status-warn-subtle text-status-warn-text border-status-warn/30'
                  : 'bg-surface-2 text-text-secondary border-separator'
              )}
            >
              {redundantPairs.length} {redundantPairs.length === 1 ? 'pair' : 'pairs'}
            </span>
          </div>

          {/* Matrix Dimension */}
          <div className="flex items-center space-x-2 text-text-tertiary font-mono text-xs">
            <span>Matrix:</span>
            <span className="text-text-secondary tabular-nums">
              {N} × {N} ({N * N} cells)
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs text-text-secondary">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-control bg-accent border border-accent/50" />
            <span>Self</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-control bg-accent/35 border border-accent/40" />
            <span>High (&ge;70%)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-control bg-accent/20 border border-accent/25" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-control bg-surface-2 border border-separator" />
            <span>Low / None</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Heatmap Grid & Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Heatmap Matrix Grid Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col">
          <div className="inline-block min-w-full">
            {/* Top Column Index Header */}
            <div className="flex items-center mb-1 pl-12">
              {chunks.map((_, colIdx) => (
                <div
                  key={`col-head-${colIdx}`}
                  className="w-10 text-center font-mono text-xs text-text-tertiary shrink-0 select-none tabular-nums"
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
                    className="w-12 text-right pr-2 font-mono text-xs text-text-tertiary shrink-0 select-none tabular-nums"
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
                            'w-10 h-8 rounded-control text-xs font-mono border flex items-center justify-center transition-all select-none active-press focus-ring tabular-nums',
                            getScoreColor(score, isSelf),
                            isSelected && 'ring-2 ring-accent ring-offset-1 ring-offset-bg z-10',
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
            <div className="mt-8 pt-4 border-t border-separator">
              <h4 className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5 select-none">
                <Info className="h-3.5 w-3.5 text-accent" />
                Sequential Chunk Transition Continuity:
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {adjacentSimilarities.map((score, idx) => (
                  <button
                    key={`adj-${idx}`}
                    onClick={() => setSelectedCell({ row: idx, col: idx + 1 })}
                    className={cn(
                      'px-2.5 py-1 rounded-control text-xs font-mono border flex items-center space-x-1.5 active-press focus-ring transition-colors',
                      selectedCell?.row === idx && selectedCell?.col === idx + 1
                        ? 'border-accent text-text bg-accent-subtle'
                        : 'bg-surface-2 text-text-secondary border-separator hover:border-separator/80'
                    )}
                  >
                    <span className="text-text-tertiary">#{idx + 1}</span>
                    <ArrowRight className="h-3 w-3 text-text-tertiary" />
                    <span className="text-text-tertiary">#{idx + 2}:</span>
                    <span
                      className={cn(
                        'tabular-nums font-semibold',
                        score >= 0.4
                          ? 'text-status-success-text'
                          : score >= 0.2
                          ? 'text-accent'
                          : 'text-status-warn-text'
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
            <div className="mt-6 p-3.5 rounded-card bg-status-warn-subtle border border-status-warn/25 text-xs">
              <div className="flex items-center space-x-2 text-status-warn-text font-semibold mb-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-status-warn" />
                <span>Detected {redundantPairs.length} High-Similarity Chunk Pair(s) (&gt;70%)</span>
              </div>
              <ul className="space-y-1.5 text-text-secondary">
                {redundantPairs.map((pair: RedundantPair, idx: number) => (
                  <li
                    key={`alert-${idx}`}
                    className="flex flex-wrap items-center gap-2 font-mono text-xs"
                  >
                    <button
                      onClick={() =>
                        setSelectedCell({ row: pair.chunkAIndex, col: pair.chunkBIndex })
                      }
                      className="underline text-status-warn-text hover:text-text font-medium"
                    >
                      Chunk #{pair.chunkAIndex + 1} &amp; Chunk #{pair.chunkBIndex + 1}
                    </button>
                    <span className="text-text-tertiary">({(pair.similarity * 100).toFixed(0)}% match)</span>
                    {pair.sharedKeywords.length > 0 && (
                      <span className="text-text-secondary text-xs">
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
          <div className="w-80 md:w-96 border-l border-separator bg-surface-1 mac-translucent flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-separator bg-surface-1/50 mac-translucent flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-text">
                  Chunk #{activePair.row + 1} ↔ Chunk #{activePair.col + 1} Comparison
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-xs font-semibold text-accent tabular-nums">
                    {(activePair.score * 100).toFixed(1)}% Cosine Similarity
                  </span>
                  {activePair.row === activePair.col && (
                    <span className="text-xs text-text-tertiary font-mono">(Self)</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="h-6 w-6 rounded-control text-text-secondary hover:text-text hover:bg-surface-2 active-press focus-ring transition-colors flex items-center justify-center"
                aria-label="Close pair inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shared Keywords Pills */}
            {activePair.sharedKeywords.length > 0 && (
              <div className="p-3 border-b border-separator bg-surface-2/40">
                <span className="text-xs font-medium text-text-secondary block mb-1.5 select-none">
                  Top Shared Distinctive Terms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activePair.sharedKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-control text-2xs font-mono bg-accent-subtle text-accent border border-accent/20"
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
              <div className="p-3 rounded-card bg-surface-2/50 border border-separator shadow-subtle">
                <div className="flex items-center justify-between mb-2 text-xs text-text-secondary font-mono">
                  <span className="text-text font-semibold">Chunk #{activePair.row + 1}</span>
                  <span className="tabular-nums">
                    {activePair.chunkA.tokenCount} tok • {activePair.chunkA.charCount} ch
                  </span>
                </div>
                <div
                  tabIndex={0}
                  role="region"
                  aria-label={`Chunk ${activePair.row + 1} text preview`}
                  className="font-sans text-xs text-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto focus-ring rounded-control"
                >
                  {activePair.chunkA.text}
                </div>
              </div>

              {/* Chunk B */}
              <div className="p-3 rounded-card bg-surface-2/50 border border-separator shadow-subtle">
                <div className="flex items-center justify-between mb-2 text-xs text-text-secondary font-mono">
                  <span className="text-text font-semibold">Chunk #{activePair.col + 1}</span>
                  <span className="tabular-nums">
                    {activePair.chunkB.tokenCount} tok • {activePair.chunkB.charCount} ch
                  </span>
                </div>
                <div
                  tabIndex={0}
                  role="region"
                  aria-label={`Chunk ${activePair.col + 1} text preview`}
                  className="font-sans text-xs text-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto focus-ring rounded-control"
                >
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
