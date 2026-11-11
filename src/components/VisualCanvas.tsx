import React, { useState, useEffect } from 'react';
import { ChunkMetadata } from '../engine/types';
import { Copy, Check, Eye, AlertTriangle, Bookmark, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { copyToClipboard } from '../utils/clipboard';

interface VisualCanvasProps {
  chunks: ChunkMetadata[];
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({ chunks }) => {
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'stream'>('cards');

  const handleCopyChunk = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const selectedChunk = chunks.find((c) => c.id === selectedChunkId);

  // Enable ArrowLeft / ArrowRight / Escape keyboard shortcuts when inspecting a chunk
  useEffect(() => {
    if (!selectedChunkId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        const currentIdx = chunks.findIndex((c) => c.id === selectedChunkId);
        if (currentIdx > 0) {
          e.preventDefault();
          setSelectedChunkId(chunks[currentIdx - 1].id);
        }
      } else if (e.key === 'ArrowRight') {
        const currentIdx = chunks.findIndex((c) => c.id === selectedChunkId);
        if (currentIdx >= 0 && currentIdx < chunks.length - 1) {
          e.preventDefault();
          setSelectedChunkId(chunks[currentIdx + 1].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedChunkId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChunkId, chunks]);

  const handlePrevChunk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedChunk) return;
    const prevIdx = selectedChunk.index - 1;
    if (prevIdx >= 0) {
      setSelectedChunkId(chunks[prevIdx].id);
    }
  };

  const handleNextChunk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedChunk) return;
    const nextIdx = selectedChunk.index + 1;
    if (nextIdx < chunks.length) {
      setSelectedChunkId(chunks[nextIdx].id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] overflow-hidden">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-surface/50 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Viewing {chunks.length} Chunks</span>
          {selectedChunk && (
            <div className="flex items-center space-x-1 font-mono">
              <button
                disabled={selectedChunk.index === 0}
                onClick={handlePrevChunk}
                className="p-1 rounded bg-surface-elevated text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors"
                title="Inspect previous chunk"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20 text-[11px]">
                #{selectedChunk.index + 1} of {chunks.length} ({selectedChunk.tokenCount} tok)
              </span>
              <button
                disabled={selectedChunk.index === chunks.length - 1}
                onClick={handleNextChunk}
                className="p-1 rounded bg-surface-elevated text-slate-300 disabled:opacity-30 hover:bg-slate-700 transition-colors"
                title="Inspect next chunk"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-surface-elevated p-0.5 rounded-md border border-slate-700">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'px-2.5 py-1 rounded text-xs transition-colors',
              viewMode === 'cards'
                ? 'bg-primary-500 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Chunk Cards
          </button>
          <button
            onClick={() => setViewMode('stream')}
            className={cn(
              'px-2.5 py-1 rounded text-xs transition-colors',
              viewMode === 'stream'
                ? 'bg-primary-500 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Continuous Stream
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chunks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Eye className="h-8 w-8 text-slate-600" />
            <p className="text-sm">No chunks generated. Adjust your document or algorithm parameters.</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
            {chunks.map((chunk) => {
              const isSelected = chunk.id === selectedChunkId;
              const badgeClass = `chunk-badge-${chunk.index % 5}`;

              return (
                <div
                  key={chunk.id}
                  onClick={() => setSelectedChunkId(isSelected ? null : chunk.id)}
                  className={cn(
                    'group rounded-xl border p-4 transition-all cursor-pointer',
                    badgeClass,
                    isSelected
                      ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/10 border-primary-500'
                      : 'hover:border-slate-600'
                  )}
                >
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        #{chunk.index + 1}
                      </span>

                      {chunk.sectionHeader && (
                        <span className="flex items-center gap-1 text-[11px] text-primary-300 bg-primary-500/20 px-2 py-0.5 rounded">
                          <Bookmark className="h-3 w-3" />
                          {chunk.sectionHeader}
                        </span>
                      )}

                      {chunk.isOrphan && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Mid-word cut
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Hash className="h-3 w-3 text-accent-cyan" />
                        <strong>{chunk.tokenCount}</strong> tokens
                      </span>
                      <span className="text-slate-400">({chunk.charCount} chars)</span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyChunk(chunk.id, chunk.text);
                        }}
                        className="p-1 rounded bg-black/30 hover:bg-black/60 text-slate-300 transition-colors"
                        title="Copy chunk text"
                      >
                        {copiedId === chunk.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chunk Content */}
                  <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {chunk.text}
                  </pre>

                  {/* Overlap Footnote */}
                  {chunk.overlapPrevChars > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Overlap with previous: ~{chunk.overlapPrevChars} chars</span>
                      {chunk.startCharIndex >= 0 && (
                        <span className="text-slate-500">
                          Offsets: [{chunk.startCharIndex} .. {chunk.endCharIndex}]
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Continuous Highlighted Stream View */
          <div className="max-w-5xl mx-auto p-6 rounded-xl bg-surface border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
                Continuous Document Stream & Boundary Highlights
              </h3>
              <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60 inline-block"></span>
                  Overlapping context
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1 py-0.5 rounded bg-primary-500/20 text-primary-300 text-[10px]">#N</span>
                  Chunk boundary
                </span>
              </div>
            </div>

            <div className="text-xs font-mono leading-relaxed space-y-3">
              {chunks.map((chunk) => {
                const badgeColor = `chunk-badge-${chunk.index % 5}`;
                const isSelected = selectedChunkId === chunk.id;
                const hasOverlap = chunk.overlapPrevChars > 0 && chunk.overlapPrevChars < chunk.text.length;
                const overlapText = hasOverlap ? chunk.text.slice(0, chunk.overlapPrevChars) : '';
                const uniqueText = hasOverlap ? chunk.text.slice(chunk.overlapPrevChars) : chunk.text;

                return (
                  <div
                    key={chunk.id}
                    onClick={() => setSelectedChunkId(isSelected ? null : chunk.id)}
                    className={cn(
                      'p-3 rounded-lg border transition-all cursor-pointer',
                      badgeColor,
                      isSelected ? 'ring-2 ring-primary-500' : 'hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10 text-[11px] font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10 text-primary-300">
                          Chunk #{chunk.index + 1}
                        </span>
                        {chunk.sectionHeader && (
                          <span className="text-slate-400">[{chunk.sectionHeader}]</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-slate-400">
                        <span>{chunk.tokenCount} tokens ({chunk.charCount} chars)</span>
                        {chunk.overlapPrevChars > 0 && (
                          <span className="text-amber-400">overlap: {chunk.overlapPrevChars} ch</span>
                        )}
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap">
                      {hasOverlap && (
                        <span
                          className="overlap-highlight px-1 py-0.5 rounded text-amber-200 mr-1"
                          title={`Overlapping context (~${chunk.overlapPrevChars} chars)`}
                        >
                          {overlapText}
                        </span>
                      )}
                      <span>{uniqueText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
