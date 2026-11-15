import React, { useState } from 'react';
import { ChunkMetadata } from '../engine/types';
import {
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  GitCommit,
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from './ui/Toast';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';
import { DetectedFormatInfo } from '../utils/fileFormatDetector';

interface ChunkInspectorProps {
  chunk: ChunkMetadata | null;
  totalChunks: number;
  prevChunk?: ChunkMetadata | null;
  nextChunk?: ChunkMetadata | null;
  detectedFormat?: DetectedFormatInfo | null;
  onSelectPrev: () => void;
  onSelectNext: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * macOS HIG Inspector Panel
 * Displays structural diagnostics, delimiter split reasons, neighbor overlap metrics, and raw content.
 */
export const ChunkInspector: React.FC<ChunkInspectorProps> = ({
  chunk,
  totalChunks,
  prevChunk,
  nextChunk,
  detectedFormat,
  onSelectPrev,
  onSelectNext,
  onClose,
  className,
}) => {
  const [hasCopied, setHasCopied] = useState(false);
  const { success } = useToast();

  if (!chunk) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(chunk.text);
    if (ok) {
      setHasCopied(true);
      success('Copied to clipboard', `Chunk #${chunk.index + 1} content copied`);
      setTimeout(() => setHasCopied(false), 1800);
    }
  };

  // Determine boundary split reason by analyzing boundary endings
  const getBoundaryReason = () => {
    if (chunk.isOrphan) {
      return {
        label: 'Hard Length Limit',
        detail: 'Word split mid-token due to max chunk size constraint',
        status: 'warning',
      };
    }
    const text = chunk.text;
    if (text.endsWith('\n\n')) {
      return {
        label: 'Double Linebreak (\\n\\n)',
        detail: 'Clean paragraph boundary preserved',
        status: 'clean',
      };
    }
    if (text.endsWith('\n')) {
      return {
        label: 'Single Linebreak (\\n)',
        detail: 'Single line break split boundary',
        status: 'clean',
      };
    }
    if (/[.!?]\s*$/.test(text)) {
      return {
        label: 'Sentence Terminator (. / ! / ?)',
        detail: 'Grammatical sentence closure preserved',
        status: 'clean',
      };
    }
    if (/[,;:]\s*$/.test(text)) {
      return {
        label: 'Clause Punctuation (, / ; / :)',
        detail: 'Sub-clause syntactic boundary',
        status: 'clean',
      };
    }
    if (/\s$/.test(text)) {
      return {
        label: 'Whitespace Boundary',
        detail: 'Split cleanly at word boundary',
        status: 'clean',
      };
    }
    return {
      label: 'Token Window Boundary',
      detail: 'Split at exact target token capacity',
      status: 'neutral',
    };
  };

  const boundary = getBoundaryReason();
  const charsPerToken = chunk.tokenCount > 0 ? (chunk.charCount / chunk.tokenCount).toFixed(1) : '0';
  const paletteIdx = chunk.index % 6;

  return (
    <>
      {/* Mobile Backdrop (< 768px) */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 max-h-[75vh] w-full rounded-t-panel border-t border-separator shadow-elevated md:static md:z-auto md:w-80 md:rounded-none md:border-t-0 md:border-l md:shadow-none bg-surface-1 mac-translucent flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-200 md:animate-none',
          className
        )}
        aria-label="Chunk Inspector"
      >
        {/* Mobile Pull Indicator */}
        <div className="w-10 h-1 bg-separator rounded-full mx-auto my-1.5 md:hidden shrink-0" />

        {/* Inspector Topbar (macOS HIG Titlebar) */}
        <div className="h-10 px-3 border-b border-separator flex items-center justify-between text-xs bg-surface-1/40 mac-translucent shrink-0">
          <div className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: `var(--chunk-${paletteIdx})` }}
            />
            <span className="font-semibold text-text text-xs">
              Chunk #{chunk.index + 1}
            </span>
            <span className="text-text-tertiary font-mono text-xs tabular-nums">
              of {totalChunks}
            </span>
          </div>

          {/* Navigation & Dismiss */}
          <div className="flex items-center space-x-1">
            <Tooltip content="Previous chunk (K or Left Arrow)">
              <button
                onClick={onSelectPrev}
                disabled={chunk.index === 0}
                className="h-6 w-6 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 disabled:opacity-20 active-press focus-ring transition-colors"
                aria-label="Previous chunk"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Next chunk (J or Right Arrow)">
              <button
                onClick={onSelectNext}
                disabled={chunk.index === totalChunks - 1}
                className="h-6 w-6 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 disabled:opacity-20 active-press focus-ring transition-colors"
                aria-label="Next chunk"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
            <span className="w-px h-3.5 bg-separator mx-0.5" />
            <Tooltip content="Close inspector (Esc or ])">
              <button
                onClick={onClose}
                className="h-6 w-6 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 active-press focus-ring transition-colors"
                aria-label="Close inspector"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
          {/* Token & Character Metrics */}
          <div>
            <span className="text-2xs font-semibold text-text-secondary select-none block mb-2">
              Metrics & sizing
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-card bg-surface-2/60 border border-separator shadow-subtle">
                <span className="text-2xs text-text-tertiary block font-mono">Tokens</span>
                <span className="text-base font-semibold text-text font-mono tabular-nums">
                  {chunk.tokenCount.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-card bg-surface-2/60 border border-separator shadow-subtle">
                <span className="text-2xs text-text-tertiary block font-mono">Characters</span>
                <span className="text-base font-semibold text-text font-mono tabular-nums">
                  {chunk.charCount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-control bg-surface-2 border border-separator text-xs font-mono text-text-secondary">
              <span>Density Ratio</span>
              <span className="tabular-nums font-semibold text-text">
                {charsPerToken} ch/tok
              </span>
            </div>
            {detectedFormat && (
              <div className="mt-1.5 flex items-center justify-between px-2.5 py-1.5 rounded-control bg-surface-2 border border-separator text-xs font-mono text-text-secondary">
                <span>File Format</span>
                <span className="font-semibold text-accent">
                  {detectedFormat.badge} ({detectedFormat.label})
                </span>
              </div>
            )}
          </div>

          {/* Boundary Diagnostics */}
          <div>
            <span className="text-2xs font-semibold text-text-secondary select-none block mb-2">
              Boundary diagnostics
            </span>
            <div className="p-2.5 rounded-card bg-surface-2/60 border border-separator space-y-2 shadow-subtle">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-1.5 text-text font-medium text-xs">
                  {boundary.status === 'warning' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-status-warn shrink-0" />
                  ) : boundary.status === 'clean' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-success shrink-0" />
                  ) : (
                    <GitCommit className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                  )}
                  <span>{boundary.label}</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-snug">
                {boundary.detail}
              </p>

              {chunk.isOrphan && (
                <div className="p-2 rounded-control bg-status-warn-subtle border border-status-warn/25 text-xs text-status-warn leading-tight">
                  Truncated mid-word. Consider increasing target chunk size or lowering overlap.
                </div>
              )}
            </div>
          </div>

          {/* Neighbor Overlap */}
          <div>
            <span className="text-2xs font-semibold text-text-secondary select-none block mb-2">
              Overlap & context window
            </span>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 rounded-control bg-surface-2 border border-separator flex items-center justify-between">
                <span className="text-text-secondary">
                  {prevChunk ? `Overlap with #${prevChunk.index + 1}:` : 'Overlap Previous:'}
                </span>
                <span className="tabular-nums font-medium text-text">
                  {chunk.overlapPrevChars > 0 ? `~${chunk.overlapPrevChars} chars` : 'None'}
                </span>
              </div>
              <div className="p-2 rounded-control bg-surface-2 border border-separator flex items-center justify-between">
                <span className="text-text-secondary">Overlap Next:</span>
                <span className="tabular-nums font-medium text-text">
                  {nextChunk && nextChunk.overlapPrevChars > 0
                    ? `~${nextChunk.overlapPrevChars} chars`
                    : 'None'}
                </span>
              </div>
              {chunk.startCharIndex >= 0 && (
                <div className="p-2 rounded-control bg-surface-2 border border-separator flex items-center justify-between text-text-tertiary">
                  <span>Offsets:</span>
                  <span className="tabular-nums">
                    [{chunk.startCharIndex} .. {chunk.endCharIndex}]
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section Header Metadata */}
          {chunk.sectionHeader && (
            <div>
              <span className="text-2xs font-semibold text-text-secondary select-none block mb-2">
                Structural section
              </span>
              <div className="p-2 rounded-control bg-surface-2 border border-separator flex items-center space-x-2 text-text-secondary text-xs">
                <Bookmark className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="truncate">{chunk.sectionHeader}</span>
              </div>
            </div>
          )}

          {/* Chunk Content Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-semibold text-text-secondary select-none">
                Content preview
              </span>
              <button
                onClick={handleCopy}
                className="h-6 px-2 rounded-control bg-surface-2 hover:bg-surface-3 border border-separator text-text-secondary hover:text-text flex items-center space-x-1 font-mono text-xs transition-colors active-press focus-ring"
                title="Copy chunk text (or C)"
              >
                {hasCopied ? (
                  <>
                    <Check className="h-3 w-3 text-status-success" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                    <kbd className="text-2xs px-1 py-0.2 rounded bg-surface-1 dark:bg-surface-3 border border-separator text-text-secondary">
                      C
                    </kbd>
                  </>
                )}
              </button>
            </div>
            <div
              tabIndex={0}
              role="region"
              aria-label="Chunk content preview"
              className="p-3 rounded-card bg-bg border border-separator font-mono text-xs text-text whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto break-words select-text focus-ring"
            >
              {chunk.text}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
