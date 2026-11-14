import React, { useState, useEffect } from 'react';
import { ChunkMetadata } from '../engine/types';
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
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
import { UploadErrorInfo } from '../hooks/useDocumentUpload';
import { UploadErrorBanner } from './UploadErrorBanner';
import { EmptyState } from './EmptyState';

interface VisualCanvasProps {
  chunks: ChunkMetadata[];
  selectedChunkId: string | null;
  onSelectChunk: (chunkId: string | null) => void;
  onLoadDefaultSample?: () => void;
  onUploadClick?: () => void;
  onDropFile?: (file: File) => void;
  onSelectSample?: (sampleId: string) => void;
  onPasteText?: (text: string, title?: string) => void;
  uploadError?: UploadErrorInfo | null;
  onDismissError?: () => void;
  isExtractingPdf?: boolean;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  chunks,
  selectedChunkId,
  onSelectChunk,
  onDropFile,
  onSelectSample,
  onPasteText,
  uploadError,
  onDismissError,
  isExtractingPdf = false,
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

      if (e.key === 'Escape') {
        onSelectChunk(null);
      } else if (chunks.length > 0) {
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'j') {
          e.preventDefault();
          if (!selectedChunk) {
            onSelectChunk(chunks[0].id);
          } else if (selectedChunk.index < chunks.length - 1) {
            onSelectChunk(chunks[selectedChunk.index + 1].id);
          }
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (!selectedChunk) {
            onSelectChunk(chunks[chunks.length - 1].id);
          } else if (selectedChunk.index > 0) {
            onSelectChunk(chunks[selectedChunk.index - 1].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chunks, selectedChunk, onSelectChunk]);

  // Stepper handlers
  const handlePrevChunk = () => {
    if (selectedChunk && selectedChunk.index > 0) {
      onSelectChunk(chunks[selectedChunk.index - 1].id);
    }
  };

  const handleNextChunk = () => {
    if (selectedChunk && selectedChunk.index < chunks.length - 1) {
      onSelectChunk(chunks[selectedChunk.index + 1].id);
    }
  };

  // Empty state rendering
  if (chunks.length === 0) {
    return (
      <EmptyState
        onSelectSample={onSelectSample || (() => {})}
        onFileUpload={onDropFile || (() => {})}
        onPasteText={onPasteText || (() => {})}
        uploadError={uploadError || null}
        onDismissError={onDismissError || (() => {})}
        isExtractingPdf={isExtractingPdf}
      />
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
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
      <div className="h-9 px-3 sm:px-6 border-b border-border-default bg-surface/30 flex items-center justify-between text-xs select-none shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-text-secondary font-mono text-xs tabular-nums hidden sm:inline">
            {chunks.length} chunks generated
          </span>

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
              <span className="text-accent bg-accent-subtle px-1.5 py-0.2 rounded text-xs tabular-nums font-mono border border-accent/20">
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

        {/* View Mode Toggle: Stream vs Cards with responsive labels and whitespace-nowrap */}
        <SegmentedControl
          size="sm"
          options={[
            {
              value: 'stream',
              label: (
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline">Continuous </span>Stream
                </span>
              ),
              icon: <Layers className="h-3 w-3" />,
            },
            {
              value: 'cards',
              label: (
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline">Separated </span>Cards
                </span>
              ),
              icon: <LayoutList className="h-3 w-3" />,
            },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val as 'stream' | 'cards')}
          ariaLabel="Canvas view mode"
        />
      </div>

      {/* Upload Error Banner (if file upload failed while canvas is populated) */}
      {uploadError && (
        <div className="px-4 sm:px-6 pt-3">
          <UploadErrorBanner
            error={uploadError}
            onDismiss={onDismissError || (() => {})}
            className="w-full"
          />
        </div>
      )}

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
                      className="my-1 py-1 px-3 border border-dashed rounded-[4px] flex items-center justify-between text-xs font-mono select-none"
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
                      'group flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-3 p-3 rounded-[6px] transition-all cursor-pointer border',
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
                    {/* Gutter: Index & Token Count (stacked horizontally on mobile, vertical column on sm+) */}
                    <div className="w-full sm:w-14 shrink-0 flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:gap-0.5 text-text-tertiary select-none pt-0.5 border-b sm:border-b-0 border-border-subtle/40 pb-1 sm:pb-0">
                      <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                        <span className="font-semibold text-text-secondary tabular-nums text-xs">
                          #{String(chunk.index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs tabular-nums font-mono">
                          {chunk.tokenCount} tok
                        </span>
                        {chunk.isOrphan && (
                          <span
                            className="text-xs text-status-warn font-sans font-medium px-1 rounded bg-status-warn/10 border border-status-warn/20"
                            title="Mid-word or unclosed syntax cut"
                          >
                            Cut
                          </span>
                        )}
                      </div>

                      {/* Mobile Copy Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyChunk(chunk.id, chunk.text);
                        }}
                        className="sm:hidden h-6 w-6 rounded hover:bg-elevated text-text-tertiary hover:text-text-primary flex items-center justify-center transition-all focus-ring shrink-0"
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

                    {/* Chunk Text Body (Full width on mobile) */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="whitespace-pre-wrap leading-relaxed text-text-primary text-[13px] break-words">
                        {chunk.text}
                      </div>
                    </div>

                    {/* Quick Copy Button on desktop (hover reveal) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyChunk(chunk.id, chunk.text);
                      }}
                      className="hidden sm:flex opacity-0 group-hover:opacity-100 h-6 w-6 rounded hover:bg-elevated text-text-tertiary hover:text-text-primary items-center justify-center transition-all focus-ring shrink-0"
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
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          /* SEPARATED CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto font-mono text-xs">
            {chunks.map((chunk) => {
              const isSelected = chunk.id === selectedChunkId;
              const paletteIdx = chunk.index % 8;

              return (
                <div
                  key={chunk.id}
                  onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
                  className={cn(
                    'p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between',
                    isSelected
                      ? 'ring-2 ring-accent border-accent shadow-elevated bg-elevated'
                      : 'border-border-default hover:border-border-strong bg-surface'
                  )}
                  style={{
                    borderTopColor: `var(--chunk-${paletteIdx})`,
                    borderTopWidth: '3px',
                  }}
                >
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-text-primary px-1.5 py-0.2 rounded bg-elevated border border-border-default tabular-nums text-xs">
                        #{chunk.index + 1}
                      </span>
                      {chunk.sectionHeader && (
                        <span className="text-xs text-text-secondary flex items-center space-x-1 truncate max-w-xs">
                          <Bookmark className="h-3 w-3 text-text-tertiary shrink-0" />
                          <span className="truncate">{chunk.sectionHeader}</span>
                        </span>
                      )}
                      {chunk.isOrphan && (
                        <span className="text-xs text-status-warn bg-status-warn/10 border border-status-warn/20 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-status-warn" />
                          <span>Mid-word cut</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-text-secondary text-xs">
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
                    <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary tabular-nums">
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
