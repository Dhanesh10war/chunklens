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
 * Pro Tool Right Inspector Panel
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
  const paletteIdx = chunk.index % 8;

  return (
    <>
      {/* Mobile Backdrop (< 768px) */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 max-h-[75vh] w-full rounded-t-xl border-t shadow-elevated md:static md:z-auto md:w-80 md:rounded-none md:border-t-0 md:border-l md:shadow-none border-border-default bg-surface flex flex-col overflow-hidden select-none animate-in slide-in-from-bottom duration-200 md:animate-none',
          className
        )}
        aria-label="Chunk Inspector"
      >
        {/* Mobile Pull Indicator */}
        <div className="w-10 h-1 bg-border-default rounded-full mx-auto my-1.5 md:hidden shrink-0" />

        {/* Inspector Topbar */}
        <div className="h-10 px-3 border-b border-border-default flex items-center justify-between text-xs bg-surface shrink-0">
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: `var(--chunk-${paletteIdx})` }}
          />
          <span className="font-semibold text-text-primary text-xs">
            Chunk #{chunk.index + 1}
          </span>
          <span className="text-text-tertiary font-mono text-[11px] tabular-nums">
            of {totalChunks}
          </span>
        </div>

        {/* Navigation & Dismiss */}
        <div className="flex items-center space-x-1">
          <Tooltip content="Previous chunk (K or Left Arrow)">
            <button
              onClick={onSelectPrev}
              disabled={chunk.index === 0}
              className="h-6 w-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated disabled:opacity-20 active-press focus-ring transition-colors"
              aria-label="Previous chunk"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Next chunk (J or Right Arrow)">
            <button
              onClick={onSelectNext}
              disabled={chunk.index === totalChunks - 1}
              className="h-6 w-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated disabled:opacity-20 active-press focus-ring transition-colors"
              aria-label="Next chunk"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          <span className="w-px h-3.5 bg-border-default mx-0.5" />
          <Tooltip content="Close inspector (Esc or ])">
            <button
              onClick={onClose}
              className="h-6 w-6 rounded flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated active-press focus-ring transition-colors"
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
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary font-semibold block mb-2">
            Metrics & Sizing
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-md bg-elevated border border-border-subtle">
              <span className="text-[10px] text-text-tertiary block">Tokens</span>
              <span className="text-sm font-semibold text-text-primary font-mono tabular-nums">
                {chunk.tokenCount.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-elevated border border-border-subtle">
              <span className="text-[10px] text-text-tertiary block">Characters</span>
              <span className="text-sm font-semibold text-text-primary font-mono tabular-nums">
                {chunk.charCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-2 py-1.5 rounded bg-surface border border-border-subtle text-[11px] font-mono text-text-secondary">
            <span>Density Ratio</span>
            <span className="tabular-nums font-semibold text-text-primary">
              {charsPerToken} ch/tok
            </span>
          </div>
          {detectedFormat && (
            <div className="mt-1.5 flex items-center justify-between px-2 py-1.5 rounded bg-surface border border-border-subtle text-[11px] font-mono text-text-secondary">
              <span>File Format</span>
              <span className="font-semibold text-accent">
                {detectedFormat.badge} ({detectedFormat.label})
              </span>
            </div>
          )}
        </div>

        {/* Boundary Diagnostics */}
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary font-semibold block mb-2">
            Boundary Diagnostics
          </span>
          <div className="p-2.5 rounded-md bg-elevated border border-border-subtle space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-text-primary font-medium text-xs">
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
            <p className="text-[11px] text-text-secondary leading-snug">
              {boundary.detail}
            </p>

            {chunk.isOrphan && (
              <div className="p-2 rounded bg-status-warn/10 border border-status-warn/25 text-[11px] text-status-warn leading-tight">
                Truncated mid-word. Consider increasing target chunk size or lowering overlap.
              </div>
            )}
          </div>
        </div>

        {/* Neighbor Overlap */}
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary font-semibold block mb-2">
            Overlap & Context Window
          </span>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="p-2 rounded bg-elevated border border-border-subtle flex items-center justify-between">
              <span className="text-text-secondary">
                {prevChunk ? `Overlap with #${prevChunk.index + 1}:` : 'Overlap Previous:'}
              </span>
              <span className="tabular-nums font-medium text-text-primary">
                {chunk.overlapPrevChars > 0 ? `~${chunk.overlapPrevChars} chars` : 'None'}
              </span>
            </div>
            <div className="p-2 rounded bg-elevated border border-border-subtle flex items-center justify-between">
              <span className="text-text-secondary">Overlap Next:</span>
              <span className="tabular-nums font-medium text-text-primary">
                {nextChunk && nextChunk.overlapPrevChars > 0
                  ? `~${nextChunk.overlapPrevChars} chars`
                  : 'None'}
              </span>
            </div>
            {chunk.startCharIndex >= 0 && (
              <div className="p-2 rounded bg-elevated border border-border-subtle flex items-center justify-between text-text-tertiary">
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
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary font-semibold block mb-2">
              Structural Section
            </span>
            <div className="p-2 rounded bg-elevated border border-border-subtle flex items-center space-x-2 text-text-secondary text-[11px]">
              <Bookmark className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="truncate">{chunk.sectionHeader}</span>
            </div>
          </div>
        )}

        {/* Chunk Content Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary font-semibold">
              Content Preview
            </span>
            <button
              onClick={handleCopy}
              className="h-6 px-2 rounded bg-elevated hover:bg-surface border border-border-default hover:border-border-hover text-text-secondary hover:text-text-primary flex items-center space-x-1 font-mono text-[10px] transition-colors active-press focus-ring"
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
                  <kbd className="text-[9px] px-1 py-0.2 rounded bg-surface border border-border-subtle">
                    C
                  </kbd>
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 rounded-md bg-bg-base border border-border-default font-mono text-xs text-text-primary whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto break-words select-text">
            {chunk.text}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
