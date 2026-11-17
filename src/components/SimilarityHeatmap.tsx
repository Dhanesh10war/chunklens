import React, { useState, useMemo } from 'react';
import { ChunkMetadata } from '../engine/types';
import {
  computeChunkSimilarityMatrix,
  computeAdjacentContinuity,
  RedundantPair,
} from '../engine/embeddings/vectorizer';
import { Layers, AlertTriangle, ArrowRight, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../utils/theme';
import { getHeatmapCellEntry } from '../utils/heatmapColors';
import { Tooltip } from './ui/Tooltip';

type HeatmapBucket = 'self' | 'high' | 'moderate' | 'low';

const MAX_HEATMAP_CHUNKS = 150;

function getCellBucket(score: number, isSelf: boolean): HeatmapBucket {
  if (isSelf) return 'self';
  if (score >= 0.70) return 'high';
  if (score >= 0.40) return 'moderate';
  return 'low';
}

interface SimilarityHeatmapProps {
  chunks: ChunkMetadata[];
}

export const SimilarityHeatmap: React.FC<SimilarityHeatmapProps> = ({ chunks }) => {
  const { isDark } = useTheme();
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [activeBucket, setActiveBucket] = useState<HeatmapBucket | null>(null);

  const N = chunks.length;
  const isCapped = N > MAX_HEATMAP_CHUNKS;

  // Cap cross-similarity matrix at 150 chunks to guarantee main-thread task <= 200ms
  const displayChunks = useMemo(
    () => (isCapped ? chunks.slice(0, MAX_HEATMAP_CHUNKS) : chunks),
    [chunks, isCapped]
  );

  // Compute similarity matrix for the displayed chunk subset
  const similarityData = useMemo(() => {
    return computeChunkSimilarityMatrix(displayChunks, 0.70);
  }, [displayChunks]);

  // Compute adjacent-neighbor continuity across the entire document in O(N) linear time
  const fullContinuity = useMemo(() => {
    if (!isCapped) return null;
    return computeAdjacentContinuity(chunks);
  }, [chunks, isCapped]);

  const { matrix, redundantPairs, sharedKeywordsMatrix } = similarityData;
  const adjacentSimilarities = fullContinuity
    ? fullContinuity.adjacentSimilarities
    : similarityData.adjacentSimilarities;
  const averageContinuity = fullContinuity
    ? fullContinuity.averageContinuity
    : similarityData.averageContinuity;

  if (N === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary bg-bg">
        <Layers className="h-10 w-10 text-text-tertiary mb-3" />
        <h3 className="text-sm font-semibold text-text">No Chunks Available</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1">
          Upload or select a corpus to compute the lexical similarity heatmap and boundary continuity matrix.
        </p>
      </div>
    );
  }

  // Selected pair details for side inspector
  const activePair = selectedCell
    ? {
        chunkA: displayChunks[selectedCell.row],
        chunkB: displayChunks[selectedCell.col],
        score: matrix[selectedCell.row]?.[selectedCell.col] ?? 0,
        sharedKeywords: sharedKeywordsMatrix[`${selectedCell.row}-${selectedCell.col}`] || [],
        row: selectedCell.row,
        col: selectedCell.col,
      }
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg text-text">
      {/* Metric Highlights Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-separator bg-surface-1/40 surface-translucent flex flex-wrap items-center justify-between gap-4 text-xs select-none">
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
              {displayChunks.length} × {displayChunks.length} ({displayChunks.length * displayChunks.length} cells)
              {isCapped && ` (capped from ${N})`}
            </span>
          </div>
        </div>

        {/* Interactive Legend with Real Swatches & Gradient Bar */}
        <div className="flex items-center space-x-3 text-xs text-text-secondary flex-wrap gap-y-2">
          {/* Bucket Swatches (clickable filters) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Self Swatch */}
            <Tooltip content="Filter self-similarity diagonal cells (click to toggle)" position="bottom">
              <button
                type="button"
                role="button"
                aria-pressed={activeBucket === 'self'}
                onClick={() => setActiveBucket((curr) => (curr === 'self' ? null : 'self'))}
                className={cn(
                  'flex items-center space-x-1.5 px-2 py-1 rounded-control border transition-all active-press focus-ring select-none text-xs',
                  activeBucket === 'self'
                    ? 'bg-accent/15 border-accent text-text font-medium ring-1 ring-accent'
                    : 'bg-surface-2/60 border-separator hover:border-separator/80 text-text-secondary hover:text-text'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-control shrink-0 border border-accent/60 shadow-subtle"
                  style={{ backgroundColor: 'var(--heat-self)' }}
                />
                <span>Self</span>
              </button>
            </Tooltip>

            {/* High Swatch */}
            <Tooltip content="Filter high overlap pairs (≥70% similarity, click to toggle)" position="bottom">
              <button
                type="button"
                role="button"
                aria-pressed={activeBucket === 'high'}
                onClick={() => setActiveBucket((curr) => (curr === 'high' ? null : 'high'))}
                className={cn(
                  'flex items-center space-x-1.5 px-2 py-1 rounded-control border transition-all active-press focus-ring select-none text-xs',
                  activeBucket === 'high'
                    ? 'bg-accent/15 border-accent text-text font-medium ring-1 ring-accent'
                    : 'bg-surface-2/60 border-separator hover:border-separator/80 text-text-secondary hover:text-text'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-control shrink-0 border border-separator/40"
                  style={{
                    backgroundColor: 'var(--heat-high)',
                    boxShadow: isDark
                      ? 'inset 0 0 0 1px color-mix(in srgb, var(--heat-text-on-dark) 55%, transparent)'
                      : 'inset 0 0 0 1px color-mix(in srgb, var(--heat-text-on-light) 55%, transparent)',
                  }}
                />
                <span>High (≥70%)</span>
              </button>
            </Tooltip>

            {/* Moderate Swatch */}
            <Tooltip content="Filter moderate similarity (40%-69%, click to toggle)" position="bottom">
              <button
                type="button"
                role="button"
                aria-pressed={activeBucket === 'moderate'}
                onClick={() => setActiveBucket((curr) => (curr === 'moderate' ? null : 'moderate'))}
                className={cn(
                  'flex items-center space-x-1.5 px-2 py-1 rounded-control border transition-all active-press focus-ring select-none text-xs',
                  activeBucket === 'moderate'
                    ? 'bg-accent/15 border-accent text-text font-medium ring-1 ring-accent'
                    : 'bg-surface-2/60 border-separator hover:border-separator/80 text-text-secondary hover:text-text'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-control shrink-0 border border-separator/40"
                  style={{ backgroundColor: 'var(--heat-mid)' }}
                />
                <span>Moderate</span>
              </button>
            </Tooltip>

            {/* Low/None Swatch */}
            <Tooltip content="Filter low similarity (<40%, click to toggle)" position="bottom">
              <button
                type="button"
                role="button"
                aria-pressed={activeBucket === 'low'}
                onClick={() => setActiveBucket((curr) => (curr === 'low' ? null : 'low'))}
                className={cn(
                  'flex items-center space-x-1.5 px-2 py-1 rounded-control border transition-all active-press focus-ring select-none text-xs',
                  activeBucket === 'low'
                    ? 'bg-accent/15 border-accent text-text font-medium ring-1 ring-accent'
                    : 'bg-surface-2/60 border-separator hover:border-separator/80 text-text-secondary hover:text-text'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-control shrink-0 border border-separator"
                  style={{ backgroundColor: 'var(--heat-low)' }}
                />
                <span>Low / None</span>
              </button>
            </Tooltip>
          </div>

          {/* Continuous Ramp Gradient Bar */}
          <div className="flex items-center space-x-1.5 pl-1 sm:pl-2 border-l border-separator">
            <span className="font-mono text-2xs text-text-tertiary select-none tabular-nums">0%</span>
            <Tooltip content="Continuous similarity color ramp: Low (0%) -> Mid (~50%) -> High (100%)" position="bottom">
              <div
                className="h-2 w-16 sm:w-24 rounded-full border border-separator/40 shadow-subtle shrink-0 cursor-help"
                style={{
                  background: 'linear-gradient(to right, var(--heat-low), var(--heat-mid), var(--heat-high))',
                }}
              />
            </Tooltip>
            <span className="font-mono text-2xs text-text-tertiary select-none tabular-nums">100%</span>
          </div>
        </div>
      </div>

      {/* Capping user notice when document exceeds 150 chunks */}
      {isCapped && (
        <div className="mx-4 sm:mx-6 mt-3 px-3.5 py-2 rounded-control bg-status-warn-subtle border border-status-warn/30 text-xs text-status-warn-text flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-status-warn" />
            <span>
              <strong>Heatmap capped at 150 chunks for responsiveness; showing adjacent-neighbor continuity.</strong> (Document contains {N} chunks; pairwise cross-similarity matrix is restricted to the first 150 chunks).
            </span>
          </div>
        </div>
      )}

      {/* Adjacent-neighbor continuity sparkline for transitions across all chunks */}
      {adjacentSimilarities.length > 0 && (
        <div className="px-4 sm:px-6 pt-3 pb-1">
          <div className="p-2.5 rounded-control bg-surface-1/50 border border-separator">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-text flex items-center gap-1.5">
                <span>Adjacent-Neighbor Boundary Continuity</span>
                <span className="text-text-tertiary font-mono text-2xs">({adjacentSimilarities.length} transitions across {N} chunks)</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-text-secondary">
                Avg: <strong className="text-text">{(averageContinuity * 100).toFixed(1)}%</strong>
              </span>
            </div>
            <div
              className="h-6 flex items-end gap-[1px] w-full overflow-hidden bg-surface-2/40 rounded-sm p-0.5"
              role="img"
              aria-label="Adjacent-neighbor continuity sparkline"
            >
              {adjacentSimilarities.map((sim, idx) => (
                <div
                  key={`spark-${idx}`}
                  className="flex-1 min-w-[2px] rounded-t-sm transition-all hover:opacity-100"
                  style={{
                    height: `${Math.max(12, Math.round(sim * 100))}%`,
                    backgroundColor:
                      sim >= 0.70
                        ? 'var(--heat-high)'
                        : sim >= 0.40
                        ? 'var(--heat-mid)'
                        : 'var(--heat-low)',
                    opacity: 0.85,
                  }}
                  title={`Chunk #${idx + 1} -> Chunk #${idx + 2}: ${(sim * 100).toFixed(1)}% boundary continuity`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace: Heatmap Grid & Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Heatmap Matrix Grid Container */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Similarity matrix grid"
          className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col focus:outline-none"
        >
          <div className="inline-block min-w-full">
            {/* Top Column Index Header */}
            <div className="flex items-center mb-1 pl-12 sticky top-0 z-10 bg-bg pb-1">
              {displayChunks.map((_, colIdx) => (
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
                    className="w-12 text-right pr-2 font-mono text-xs text-text-tertiary shrink-0 select-none tabular-nums sticky left-0 z-10 bg-bg"
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

                      const entry = isSelf
                        ? {
                            backgroundColor: 'var(--heat-self)',
                            color: '#FFFFFF',
                            boxShadow: undefined,
                          }
                        : getHeatmapCellEntry(score, isDark);

                      const bucket = getCellBucket(score, isSelf);
                      const isDimmed = activeBucket !== null && bucket !== activeBucket;

                      return (
                        <button
                          key={`cell-${rowIdx}-${colIdx}`}
                          onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                          style={{
                            backgroundColor: entry.backgroundColor,
                            color: entry.color,
                            boxShadow: entry.boxShadow,
                          }}
                          title={`Chunk #${rowIdx + 1} ↔ Chunk #${colIdx + 1}: ${(score * 100).toFixed(0)}% similarity${
                            isAdjacent ? ' (Adjacent boundary)' : ''
                          }`}
                          className={cn(
                            'w-10 h-8 rounded-control text-xs font-mono border flex items-center justify-center select-none tabular-nums font-medium transition-all active-press focus-ring',
                            'border-separator/30 hover:-translate-y-[1px] hover:outline hover:outline-2 hover:outline-accent hover:outline-offset-1 hover:z-20',
                            isDimmed && 'opacity-30 hover:opacity-100',
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
          <div className="w-80 md:w-96 border-l border-separator bg-surface-1 surface-translucent flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-150">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-separator bg-surface-1/50 surface-translucent flex items-center justify-between">
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
