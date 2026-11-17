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
import { Tooltip } from './ui/Tooltip';
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
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key.toLowerCase() === 'j') {
          e.preventDefault();
          if (!selectedChunk) {
            onSelectChunk(chunks[0].id);
          } else if (selectedChunk.index < chunks.length - 1) {
            onSelectChunk(chunks[selectedChunk.index + 1].id);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'k') {
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

  // Auto-scroll focused chunk into view smoothly
  useEffect(() => {
    if (selectedChunkId) {
      const el = document.getElementById(`chunk-card-${selectedChunkId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedChunkId]);

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

  // Renders document prose in sans, code blocks in mono
  const renderFormattedChunkText = (text: string) => {
    if (!text.includes('```')) {
      return (
        <div className="font-sans text-sm leading-relaxed text-text whitespace-pre-wrap break-words select-text">
          {text}
        </div>
      );
    }

    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div className="text-sm leading-relaxed text-text break-words select-text">
        {parts.map((part, pIdx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const rawCode = part.slice(3, -3);
            const cleanCode = rawCode.replace(/^[a-z0-9_-]+\n/i, '');
            return (
              <pre
                key={pIdx}
                tabIndex={0}
                role="region"
                aria-label="Code block"
                className="my-2 p-3 rounded-control bg-surface-2 border border-separator font-mono text-xs text-text overflow-x-auto whitespace-pre leading-normal focus-ring"
              >
                <code>{cleanCode}</code>
              </pre>
            );
          }
          return (
            <span key={pIdx} className="font-sans whitespace-pre-wrap">
              {part}
            </span>
          );
        })}
      </div>
    );
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
      className="relative flex-1 flex flex-col h-full bg-bg overflow-hidden"
    >
      {/* Drag & Drop Visual Target Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-bg/90 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-accent m-4 rounded-panel text-center select-none pointer-events-none animate-in fade-in duration-100">
          <div className="h-12 w-12 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent mb-2">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-text">Drop document to auto-detect format</p>
          <p className="text-xs text-text-secondary mt-1">Supports PDF, Markdown, CSV, JSON, and Source Code</p>
        </div>
      )}

      {/* Sub-header Toolbar: View Switcher & Stepper */}
      <div className="h-10 px-3 sm:px-6 border-b border-separator bg-surface-1/40 surface-translucent flex items-center justify-between text-xs select-none shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-text-secondary font-mono text-xs tabular-nums hidden sm:inline">
            {chunks.length} chunks generated
          </span>

          {selectedChunk && (
            <div className="flex items-center space-x-1 font-mono text-xs">
              <Tooltip content="Previous chunk" shortcut="K" position="bottom">
                <button
                  disabled={selectedChunk.index === 0}
                  onClick={handlePrevChunk}
                  className="h-6 w-6 rounded-control bg-surface-2 border border-separator text-text-secondary disabled:opacity-25 hover:text-text hover:bg-surface-3 flex items-center justify-center active-press focus-ring transition-colors"
                  aria-label="Previous chunk"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
              </Tooltip>
              <span className="text-accent bg-accent-subtle px-2 py-0.5 rounded-control text-xs tabular-nums font-mono border border-accent/20">
                #{selectedChunk.index + 1} of {chunks.length} ({selectedChunk.tokenCount} tok)
              </span>
              <Tooltip content="Next chunk" shortcut="J" position="bottom">
                <button
                  disabled={selectedChunk.index === chunks.length - 1}
                  onClick={handleNextChunk}
                  className="h-6 w-6 rounded-control bg-surface-2 border border-separator text-text-secondary disabled:opacity-25 hover:text-text hover:bg-surface-3 flex items-center justify-center active-press focus-ring transition-colors"
                  aria-label="Next chunk"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* View Mode Toggle: Stream vs Cards */}
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
              icon: <Layers className="h-3.5 w-3.5" />,
            },
            {
              value: 'cards',
              label: (
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline">Separated </span>Cards
                </span>
              ),
              icon: <LayoutList className="h-3.5 w-3.5" />,
            },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val as 'stream' | 'cards')}
          ariaLabel="Canvas view mode"
        />
      </div>

      {/* Upload Error Banner */}
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
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {chunks.map((chunk, idx) => {
              const isSelected = chunk.id === selectedChunkId;
              const paletteIdx = chunk.index % 6;
              const prevChunk = idx > 0 ? chunks[idx - 1] : null;
              const prevPaletteIdx = prevChunk ? prevChunk.index % 6 : 0;
              const budgetPercent = Math.min(100, Math.round((chunk.tokenCount / 512) * 100));

              return (
                <React.Fragment key={chunk.id}>
                  {/* Overlap Diagonal Hatch Band */}
                  {chunk.overlapPrevChars > 0 && (
                    <div
                      className="my-1 py-1 px-3 border border-dashed rounded-control flex items-center justify-between text-xs font-mono select-none"
                      style={{
                        backgroundImage: `repeating-linear-gradient(-45deg, var(--chunk-${prevPaletteIdx}-bg), var(--chunk-${prevPaletteIdx}-bg) 4px, var(--chunk-${paletteIdx}-bg) 4px, var(--chunk-${paletteIdx}-bg) 8px)`,
                        borderColor: `var(--chunk-${paletteIdx})`,
                      }}
                    >
                      <span className="text-text font-medium bg-surface-1/90 px-2 py-0.5 rounded-control shadow-subtle border border-separator">
                        ▨▨ ~{chunk.overlapPrevChars} ch overlap with Chunk #{chunk.index}
                      </span>
                      <span className="text-text-tertiary hidden sm:inline">
                        Preserves semantic continuity across split boundary
                      </span>
                    </div>
                  )}

                  {/* Chunk Reading Card */}
                  <div
                    id={`chunk-card-${chunk.id}`}
                    onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
                    className={cn(
                      'group flex flex-col p-3.5 sm:p-4 rounded-card transition-all cursor-pointer border shadow-subtle',
                      isSelected
                        ? 'ring-2 ring-accent border-accent/40 shadow-elevated'
                        : 'border-separator/40 hover:border-separator'
                    )}
                    style={{
                      backgroundColor: `var(--chunk-${paletteIdx}-bg)`,
                      borderLeftColor: `var(--chunk-${paletteIdx})`,
                      borderLeftWidth: '3px',
                    }}
                  >
                    {/* Header Row: #01 Pill, Token count + Budget Bar, Copy Button */}
                    <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-separator/30 text-xs select-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded-control bg-surface-1 dark:bg-surface-3 border border-separator font-mono font-medium text-xs text-text tabular-nums shrink-0">
                          #{String(chunk.index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
                          <span className="tabular-nums font-medium text-text">
                            {chunk.tokenCount}
                          </span>
                          <span className="text-text-tertiary">/ 512 tok</span>
                        </div>
                        {/* Token Budget Progress Bar */}
                        <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden hidden sm:block shrink-0">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${budgetPercent}%`,
                              backgroundColor: `var(--chunk-${paletteIdx})`,
                            }}
                          />
                        </div>
                        {chunk.sectionHeader && (
                          <span className="text-xs text-text-tertiary hidden md:flex items-center gap-1 truncate max-w-xs">
                            <Bookmark className="h-3 w-3 shrink-0" />
                            <span className="truncate">{chunk.sectionHeader}</span>
                          </span>
                        )}
                        {chunk.isOrphan && (
                          <Tooltip content="Mid-word or unclosed syntax cut">
                            <span className="text-xs text-status-warn font-sans font-medium px-1.5 py-0.2 rounded-control bg-status-warn-subtle border border-status-warn/20">
                              Cut
                            </span>
                          </Tooltip>
                        )}
                      </div>

                      {/* Copy Action Button */}
                      <Tooltip content="Copy chunk text">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyChunk(chunk.id, chunk.text);
                          }}
                          className="h-7 w-7 rounded-control hover:bg-surface-2 text-text-tertiary hover:text-text flex items-center justify-center transition-all focus-ring shrink-0"
                          aria-label={`Copy chunk ${chunk.index + 1}`}
                        >
                          {copiedId === chunk.id ? (
                            <Check className="h-3.5 w-3.5 text-status-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </Tooltip>
                    </div>

                    {/* Chunk Text Content (Prose in sans, code in mono) */}
                    <div className="min-w-0 w-full">
                      {renderFormattedChunkText(chunk.text)}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          /* SEPARATED CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto text-xs">
            {chunks.map((chunk) => {
              const isSelected = chunk.id === selectedChunkId;
              const paletteIdx = chunk.index % 6;
              const budgetPercent = Math.min(100, Math.round((chunk.tokenCount / 512) * 100));

              return (
                <div
                  key={chunk.id}
                  id={`chunk-card-${chunk.id}`}
                  onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
                  className={cn(
                    'p-4 rounded-card border transition-all cursor-pointer flex flex-col justify-between shadow-subtle',
                    isSelected
                      ? 'ring-2 ring-accent border-accent/40 shadow-elevated bg-surface-2'
                      : 'border-separator hover:border-separator/80 bg-surface-1 hover:bg-surface-2/40'
                  )}
                  style={{
                    borderLeftColor: `var(--chunk-${paletteIdx})`,
                    borderLeftWidth: '3px',
                  }}
                >
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-separator text-xs select-none">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="font-semibold text-text px-1.5 py-0.5 rounded-control bg-surface-2 border border-separator tabular-nums text-xs font-mono">
                        #{chunk.index + 1}
                      </span>
                      {chunk.sectionHeader && (
                        <span className="text-xs text-text-secondary flex items-center space-x-1 truncate max-w-[160px]">
                          <Bookmark className="h-3 w-3 text-text-tertiary shrink-0" />
                          <span className="truncate">{chunk.sectionHeader}</span>
                        </span>
                      )}
                      {chunk.isOrphan && (
                        <span className="text-xs text-status-warn bg-status-warn-subtle border border-status-warn/20 px-1.5 py-0.2 rounded-control flex items-center gap-1 font-sans">
                          <AlertTriangle className="h-3 w-3 text-status-warn" />
                          <span>Cut</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5 text-text-secondary text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="tabular-nums">
                          <strong className="text-text font-medium">{chunk.tokenCount}</strong> tok
                        </span>
                        <div className="w-12 h-1.5 bg-surface-2 rounded-full overflow-hidden hidden sm:block shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${budgetPercent}%`,
                              backgroundColor: `var(--chunk-${paletteIdx})`,
                            }}
                          />
                        </div>
                      </div>
                      <Tooltip content="Copy chunk text">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyChunk(chunk.id, chunk.text);
                          }}
                          className="h-7 w-7 rounded-control hover:bg-surface-3 text-text-tertiary hover:text-text flex items-center justify-center transition-colors focus-ring"
                          aria-label={`Copy chunk ${chunk.index + 1}`}
                        >
                          {copiedId === chunk.id ? (
                            <Check className="h-3.5 w-3.5 text-status-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Chunk Text Content */}
                  <div className="my-1">
                    {renderFormattedChunkText(chunk.text)}
                  </div>

                  {/* Overlap Footnote */}
                  {chunk.overlapPrevChars > 0 && (
                    <div className="mt-3 pt-2 border-t border-separator flex items-center justify-between text-2xs text-text-tertiary font-mono tabular-nums select-none">
                      <span>Overlap with prev: ~{chunk.overlapPrevChars} ch</span>
                      <span>[{chunk.startCharIndex} .. {chunk.endCharIndex}]</span>
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
