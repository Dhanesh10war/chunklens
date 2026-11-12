import React, { useState, useEffect } from 'react';
import { ChunkMetadata } from '../engine/types';
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Bookmark,
  Layers,
  LayoutList,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { copyToClipboard } from '../utils/clipboard';
import { SegmentedControl } from './ui/SegmentedControl';
import { useToast } from './ui/Toast';
import { DetectedFormatInfo } from '../utils/fileFormatDetector';

interface VisualCanvasProps {
  chunks: ChunkMetadata[];
  selectedChunkId: string | null;
  onSelectChunk: (chunkId: string | null) => void;
  detectedFormat?: DetectedFormatInfo | null;
  onLoadDefaultSample?: () => void;
  onUploadClick?: () => void;
  onDropFile?: (file: File) => void;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  chunks,
  selectedChunkId,
  onSelectChunk,
  detectedFormat,
  onLoadDefaultSample,
  onUploadClick,
  onDropFile,
}) => {
  const [viewMode, setViewMode] = useState<'stream' | 'cards'>('stream');
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { success } = useToast();

  const selectedChunk = chunks.find((c) => c.id === selectedChunkId);

  const handleCopyChunk = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      success('Copied to clipboard', `Chunk #${id} copied`);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Keyboard navigation: Left/Right arrow steps through chunks; Escape clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape' && selectedChunkId) {
        e.preventDefault();
        onSelectChunk(null);
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        const currentIdx = chunks.findIndex((c) => c.id === selectedChunkId);
        if (currentIdx > 0) {
          e.preventDefault();
          onSelectChunk(chunks[currentIdx - 1].id);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'j') {
        const currentIdx = chunks.findIndex((c) => c.id === selectedChunkId);
        if (currentIdx >= 0 && currentIdx < chunks.length - 1) {
          e.preventDefault();
          onSelectChunk(chunks[currentIdx + 1].id);
        } else if (currentIdx === -1 && chunks.length > 0) {
          e.preventDefault();
          onSelectChunk(chunks[0].id);
        }
      } else if ((e.key === 'c' || e.key === 'C') && selectedChunk) {
        e.preventDefault();
        handleCopyChunk(selectedChunk.id, selectedChunk.text);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChunkId, selectedChunk, chunks, onSelectChunk]);

  const handlePrevChunk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedChunk) return;
    const prevIdx = selectedChunk.index - 1;
    if (prevIdx >= 0) {
      onSelectChunk(chunks[prevIdx].id);
    }
  };

  const handleNextChunk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedChunk) return;
    const nextIdx = selectedChunk.index + 1;
    if (nextIdx < chunks.length) {
      onSelectChunk(chunks[nextIdx].id);
    }
  };

  // Empty State with Recovery Actions
  if (chunks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-base select-none">
        <div className="h-12 w-12 rounded-lg bg-elevated border border-border-default flex items-center justify-center text-text-tertiary mb-3">
          <FileQuestion className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">No document loaded</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1 mb-5">
          Load a sample corpus or upload a text, markdown, PDF, or CSV document to inspect chunking and token boundaries.
        </p>
        <div className="flex items-center space-x-2">
          {onLoadDefaultSample && (
            <button
              onClick={onLoadDefaultSample}
              className="h-8 px-3 rounded-md text-xs font-medium bg-surface hover:bg-elevated text-text-primary border border-border-default hover:border-border-hover transition-colors active-press focus-ring"
            >
              Load Sample Document
            </button>
          )}
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="h-8 px-3 rounded-md text-xs font-medium bg-accent hover:bg-[var(--accent-hover)] text-white shadow-subtle transition-colors active-press focus-ring"
            >
              Upload Document
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        // Only reset if leaving canvas boundary
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && onDropFile) {
          onDropFile(file);
        }
      }}
      className="relative flex-1 flex flex-col h-full bg-bg-base overflow-hidden"
    >
      {/* Drag & Drop Visual Target Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-bg-base/90 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-accent m-4 rounded-xl text-center select-none pointer-events-none animate-in fade-in duration-100">
          <div className="h-12 w-12 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent mb-2">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-text-primary">Drop document to auto-detect format</p>
          <p className="text-xs text-text-secondary mt-1">Supports PDF, Markdown, CSV, JSON, and Source Code</p>
        </div>
      )}

      {/* Sub-header Toolbar: View Switcher & Stepper */}
      <div className="h-9 px-4 sm:px-6 border-b border-border-default bg-surface/30 flex items-center justify-between text-xs select-none shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-text-secondary font-mono text-[11px] tabular-nums">
            {chunks.length} chunks generated
          </span>

          {detectedFormat && (
            <span
              className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-border-default bg-surface text-text-secondary select-none"
              title={`Format: ${detectedFormat.label} (${detectedFormat.description})`}
            >
              <span className="font-semibold text-accent">{detectedFormat.badge}</span>
              <span className="text-text-tertiary">·</span>
              <span>{detectedFormat.label}</span>
            </span>
          )}

          {selectedChunk && (
            <div className="flex items-center space-x-1 font-mono text-xs">
              <button
                disabled={selectedChunk.index === 0}
                onClick={handlePrevChunk}
                className="h-5 w-5 rounded bg-surface border border-border-default text-text-secondary disabled:opacity-25 hover:text-text-primary hover:bg-elevated flex items-center justify-center active-press focus-ring transition-colors"
                title="Inspect previous chunk (or Left Arrow / K)"
                aria-label="Previous chunk"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-accent bg-accent-subtle px-1.5 py-0.2 rounded text-[11px] tabular-nums font-mono border border-accent/20">
                #{selectedChunk.index + 1} of {chunks.length} ({selectedChunk.tokenCount} tok)
              </span>
              <button
                disabled={selectedChunk.index === chunks.length - 1}
                onClick={handleNextChunk}
                className="h-5 w-5 rounded bg-surface border border-border-default text-text-secondary disabled:opacity-25 hover:text-text-primary hover:bg-elevated flex items-center justify-center active-press focus-ring transition-colors"
                title="Inspect next chunk (or Right Arrow / J)"
                aria-label="Next chunk"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* View Mode Toggle: Stream vs Cards */}
        <SegmentedControl
          size="sm"
          options={[
            { value: 'stream', label: 'Continuous Stream', icon: <Layers className="h-3 w-3" /> },
            { value: 'cards', label: 'Separated Cards', icon: <LayoutList className="h-3 w-3" /> },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val as 'stream' | 'cards')}
          ariaLabel="Canvas view mode"
        />
      </div>

      {/* Main Canvas Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ contentVisibility: 'auto' }}>
        {viewMode === 'stream' ? (
          /* CONTINUOUS READING COLUMN (Hero Mode) */
          <div className="max-w-4xl mx-auto flex flex-col font-mono text-xs">
            {chunks.map((chunk, idx) => {
              const isSelected = chunk.id === selectedChunkId;
              const paletteIdx = chunk.index % 8;
              const prevChunk = idx > 0 ? chunks[idx - 1] : null;
              const prevPaletteIdx = prevChunk ? prevChunk.index % 8 : 0;

              return (
                <React.Fragment key={chunk.id}>
                  {/* Overlap Diagonal Hatch Band */}
                  {chunk.overlapPrevChars > 0 && (
                    <div
                      className="my-1 py-1 px-3 border border-dashed rounded-[4px] flex items-center justify-between text-[10px] font-mono select-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(-45deg, var(--chunk-${prevPaletteIdx}-bg), var(--chunk-${prevPaletteIdx}-bg) 4px, var(--chunk-${paletteIdx}-bg) 4px, var(--chunk-${paletteIdx}-bg) 8px)`,
                        borderColor: `var(--chunk-${paletteIdx})`,
                      }}
                    >
                      <span className="text-text-primary font-medium bg-surface/80 px-1.5 py-0.5 rounded shadow-subtle">
                        ▨▨ ~{chunk.overlapPrevChars} ch overlap with Chunk #{chunk.index}
                      </span>
                      <span className="text-text-tertiary hidden sm:inline">
                        Preserves semantic continuity across split boundary
                      </span>
                    </div>
                  )}

                  {/* Chunk Reading Row */}
                  <div
                    onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
                    className={cn(
                      'group flex items-start gap-3 p-3 rounded-[6px] transition-all cursor-pointer border',
                      isSelected
                        ? 'ring-2 ring-accent border-accent shadow-elevated'
                        : 'border-transparent hover:border-border-default'
                    )}
                    style={{
                      backgroundColor: `var(--chunk-${paletteIdx}-bg)`,
                      borderLeftColor: `var(--chunk-${paletteIdx})`,
                      borderLeftWidth: '3px',
                    }}
                  >
                    {/* Gutter: Index & Token Count */}
                    <div className="w-14 shrink-0 flex flex-col items-start gap-0.5 text-text-tertiary select-none pt-0.5">
                      <span
                        className={cn(
                          'text-[11px] font-semibold tabular-nums',
                          isSelected ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'
                        )}
                      >
                        #{String(chunk.index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] tabular-nums text-text-tertiary">
                        {chunk.tokenCount} tok
                      </span>
                    </div>

                    {/* Chunk Text Content */}
                    <div className="flex-1 min-w-0">
                      {chunk.sectionHeader && (
                        <div className="mb-1.5 flex items-center space-x-1 text-[11px] font-medium text-text-secondary">
                          <Bookmark className="h-3 w-3 text-text-tertiary shrink-0" />
                          <span className="truncate">{chunk.sectionHeader}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed text-text-primary text-[13px] break-words">
                        {chunk.text}
                      </p>
                    </div>

                    {/* Quick Copy Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyChunk(chunk.id, chunk.text);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface text-text-tertiary hover:text-text-primary transition-opacity focus-ring"
                      title="Copy chunk text (or C)"
                      aria-label={`Copy chunk ${chunk.index + 1}`}
                    >
                      {copiedId === chunk.id ? (
                        <Check className="h-3.5 w-3.5 text-status-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          /* SEPARATED CARDS VIEW */
          <div className="max-w-4xl mx-auto flex flex-col gap-3 font-mono text-xs">
            {chunks.map((chunk) => {
              const isSelected = chunk.id === selectedChunkId;
              const paletteIdx = chunk.index % 8;

              return (
                <div
                  key={chunk.id}
                  onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
                  className={cn(
                    'p-3.5 rounded-md bg-surface border transition-all cursor-pointer shadow-subtle',
                    isSelected
                      ? 'ring-2 ring-accent border-accent'
                      : 'border-border-default hover:border-border-hover'
                  )}
                  style={{
                    borderLeftColor: `var(--chunk-${paletteIdx})`,
                    borderLeftWidth: '3px',
                  }}
                >
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-text-primary px-1.5 py-0.2 rounded bg-elevated border border-border-default tabular-nums text-[11px]">
                        #{chunk.index + 1}
                      </span>
                      {chunk.sectionHeader && (
                        <span className="text-[11px] text-text-secondary flex items-center space-x-1 truncate max-w-xs">
                          <Bookmark className="h-3 w-3 text-text-tertiary shrink-0" />
                          <span className="truncate">{chunk.sectionHeader}</span>
                        </span>
                      )}
                      {chunk.isOrphan && (
                        <span className="text-[10px] text-status-warn bg-status-warn/10 border border-status-warn/20 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-status-warn" />
                          <span>Mid-word cut</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-text-secondary text-[11px]">
                      <span className="tabular-nums">
                        <strong className="text-text-primary">{chunk.tokenCount}</strong> tok ({chunk.charCount} ch)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyChunk(chunk.id, chunk.text);
                        }}
                        className="h-6 w-6 rounded hover:bg-elevated text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors focus-ring"
                        title="Copy chunk text"
                        aria-label={`Copy chunk ${chunk.index + 1}`}
                      >
                        {copiedId === chunk.id ? (
                          <Check className="h-3.5 w-3.5 text-status-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chunk Text */}
                  <p className="whitespace-pre-wrap leading-relaxed text-text-primary text-[13px] break-words">
                    {chunk.text}
                  </p>

                  {/* Overlap Footnote */}
                  {chunk.overlapPrevChars > 0 && (
                    <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-tertiary tabular-nums">
                      <span>Overlap with previous: ~{chunk.overlapPrevChars} chars</span>
                      <span>Offsets: [{chunk.startCharIndex} .. {chunk.endCharIndex}]</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
