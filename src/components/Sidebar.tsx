import React, { useRef, useState, useEffect } from 'react';
import { ChunkingConfig, ChunkingStrategy, TokenizerEncoding, ChunkUnit } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { Upload, RotateCcw, FileText, FilePlus, Cpu, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { SegmentedControl } from './ui/SegmentedControl';
import { SliderWithInput } from './ui/SliderWithInput';
import { Tooltip } from './ui/Tooltip';
import { DetectedFormatInfo } from '../utils/fileFormatDetector';
import { cn } from '../utils/cn';

interface SidebarProps {
  config: ChunkingConfig;
  onChangeConfig: (newConfig: ChunkingConfig) => void;
  selectedSampleId: string | null;
  onSelectSample: (id: string) => void;
  onFileUpload: (file: File) => void;
  onNewDocument?: () => void;
  onOpenTokenizerModal?: () => void;
  onPrefetchTokenizerModal?: () => void;
  currentDocumentTitle?: string;
  detectedFormat?: DetectedFormatInfo | null;
  isOpen: boolean;
  onClose?: () => void;
  isExtractingPdf?: boolean;
  rememberDocument?: boolean;
  onToggleRememberDocument?: (enabled: boolean) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onChangeConfig,
  selectedSampleId,
  onSelectSample,
  onFileUpload,
  onNewDocument,
  onOpenTokenizerModal,
  onPrefetchTokenizerModal,
  detectedFormat,
  isOpen,
  onClose,
  isExtractingPdf = false,
  rememberDocument = false,
  onToggleRememberDocument,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Collapsible section toggles (default open)
  const [isStrategySectionOpen, setIsStrategySectionOpen] = useState(true);
  const [isTokenizerSectionOpen, setIsTokenizerSectionOpen] = useState(true);
  const [isSizeSectionOpen, setIsSizeSectionOpen] = useState(true);

  const [separatorsText, setSeparatorsText] = useState<string>(
    config.separators ? config.separators.map((s) => JSON.stringify(s)).join(', ') : ''
  );

  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(max-width: 1023px)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobileOrTablet(e.matches);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobileOrTablet) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const drawerEl = drawerRef.current;
    if (drawerEl) {
      const focusable = drawerEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'Tab' && drawerEl) {
        const focusable = Array.from(
          drawerEl.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, isMobileOrTablet, onClose]);

  if (!isOpen) return null;

  const handleSeparatorsChange = (raw: string) => {
    setSeparatorsText(raw);
    if (!raw.trim()) {
      onChangeConfig({ ...config, separators: undefined });
      return;
    }
    const parts = raw.split(',').map((s) => {
      let t = s.trim();
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1);
      }
      return t.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    });
    onChangeConfig({ ...config, separators: parts });
  };

  const handleResetSeparators = () => {
    setSeparatorsText('');
    onChangeConfig({ ...config, separators: undefined });
  };

  const handleUnitToggle = (unit: ChunkUnit) => {
    const isTokens = unit === 'tokens';
    const newChunkSize = isTokens ? Math.min(500, config.chunkSize) : Math.max(1000, config.chunkSize * 4);
    const newOverlap = isTokens ? Math.min(50, config.chunkOverlap) : Math.max(100, config.chunkOverlap * 4);
    onChangeConfig({
      ...config,
      unit,
      chunkSize: newChunkSize,
      chunkOverlap: newOverlap,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileUpload(file);
    e.target.value = '';
  };

  const isTokens = config.unit === 'tokens';
  const sizeMin = isTokens ? 50 : 200;
  const sizeMax = isTokens ? 2048 : 8000;
  const sizeStep = isTokens ? 25 : 100;

  const overlapMin = 0;
  const overlapMax = isTokens ? 500 : 2000;
  const overlapStep = isTokens ? 10 : 50;

  return (
    <>
      {/* Mobile/Tablet Backdrop Scrim */}
      {isMobileOrTablet && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        ref={drawerRef}
        role={isMobileOrTablet ? 'dialog' : undefined}
        aria-modal={isMobileOrTablet ? true : undefined}
        aria-label={isMobileOrTablet ? 'Configuration drawer' : undefined}
        className={cn(
          isMobileOrTablet
            ? 'fixed inset-y-0 left-0 z-50 w-[90dvw] max-w-[320px] bg-surface-1 shadow-modal pt-safe pb-safe pl-safe'
            : 'static z-20 w-[320px] shadow-none surface-translucent border-r border-separator',
          'flex flex-col h-full shrink-0 select-none overflow-y-auto',
          className
        )}
      >
        <div className="flex flex-col flex-1 pb-8">
          {/* Mobile Header / Close Bar */}
          {isMobileOrTablet && (
            <div className="flex items-center justify-between p-3 border-b border-separator">
              <span className="font-semibold text-xs text-text">
                Configuration
              </span>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-control flex items-center justify-center hover:bg-surface-2 text-text-secondary hover:text-text focus-ring transition-colors active-press"
                aria-label="Close configuration drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

        <div className="p-4 flex flex-col gap-5 text-xs">
          {/* SECTION 1: SOURCE */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text select-none">
                Document source
              </span>
              {onNewDocument && (
                <Tooltip content="Clear document and open empty dropzone" position="right">
                  <button
                    onClick={onNewDocument}
                    className="inline-flex items-center gap-1.5 text-xs font-sans text-accent hover:text-accent-hover focus-ring rounded-control px-2.5 py-1 min-h-[32px] transition-colors"
                    aria-label="New document: clear canvas"
                  >
                    <FilePlus className="h-3.5 w-3.5" />
                    <span>New document</span>
                  </button>
                </Tooltip>
              )}
            </div>

            {/* Sample Corpora Selection */}
            <div className="flex flex-col gap-0.5 border border-separator rounded-card bg-surface-2/40 p-1">
              {SAMPLE_DOCUMENTS.map((sample) => {
                const isSelected = sample.id === selectedSampleId;
                const approxTokens = Math.round(sample.content.length / 4);
                return (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample.id)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-control text-left transition-colors active-press focus-ring text-xs border',
                      isSelected
                        ? 'bg-accent-subtle text-text font-medium border-accent/25 shadow-subtle'
                        : 'text-text-secondary hover:text-text hover:bg-surface-2/80 border-transparent'
                    )}
                  >
                    <div className="flex items-center space-x-2 truncate min-w-0 pr-2">
                      <FileText className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-accent' : 'text-text-tertiary')} />
                      <span className="truncate">{sample.title}</span>
                    </div>
                    <span className="text-2xs font-mono text-text-tertiary shrink-0 tabular-nums">
                      ~{approxTokens.toLocaleString()} tok
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Upload Button & Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onFileUpload(file);
              }}
              className={cn(
                'rounded-control transition-all',
                isDraggingFile && 'ring-2 ring-accent bg-accent-subtle/20'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,.json,.jsonl,.csv,.tsv,.py,.js,.ts,.html,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
                aria-label="Upload document"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Upload className="h-3.5 w-3.5" />}
                isLoading={isExtractingPdf}
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-xs"
              >
                {isExtractingPdf
                  ? 'Extracting PDF...'
                  : isDraggingFile
                  ? 'Drop file here to detect format'
                  : 'Upload or drop document'}
              </Button>
            </div>

            {/* Active Detected Format Indicator */}
            {detectedFormat && !selectedSampleId && (
              <div className="p-2 rounded-control bg-surface-2 border border-separator flex items-center justify-between text-xs select-none">
                <span className="text-text-secondary">Detected format:</span>
                <span className="px-1.5 py-0.5 rounded-control bg-surface-1 border border-separator text-accent font-medium font-mono flex items-center gap-1 text-xs">
                  <span>{detectedFormat.badge}</span>
                  <span className="text-text-tertiary font-normal">({detectedFormat.label})</span>
                </span>
              </div>
            )}

            {/* Document Persistence Opt-In (AUDIT-01, AUDIT-09) */}
            <div className="pt-2 border-t border-separator/60">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none group min-h-[32px]">
                <input
                  type="checkbox"
                  checked={rememberDocument}
                  onChange={(e) => onToggleRememberDocument?.(e.target.checked)}
                  aria-label="Remember my document on this device"
                  className="w-6 h-6 rounded border-separator text-accent focus:ring-accent cursor-pointer shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-text group-hover:text-accent transition-colors">
                    Remember my document on this device
                  </span>
                  <p className="text-2xs text-text-tertiary leading-tight">
                    Default OFF (1 MB cap). When off, documents remain strictly ephemeral in RAM.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="h-px bg-separator" />

          {/* SECTION 2: CHUNKING STRATEGY */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsStrategySectionOpen(!isStrategySectionOpen)}
              className="flex items-center justify-between text-left group focus-ring rounded-control -mx-1 px-2 min-h-[36px] py-1.5 transition-colors"
            >
              <span className="text-xs font-semibold text-text select-none">
                Chunking strategy
              </span>
              <span className="text-text-tertiary group-hover:text-text transition-colors">
                {isStrategySectionOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>
            </button>

            {isStrategySectionOpen && (
              <div className="flex flex-col gap-3">
                <Select
                  label="Algorithm"
                  value={config.strategy}
                  onChange={(e) =>
                    onChangeConfig({ ...config, strategy: e.target.value as ChunkingStrategy })
                  }
                  options={[
                    { value: 'recursive', label: 'Recursive Character (LangChain)' },
                    { value: 'fixed', label: 'Fixed Size with Overlap' },
                    { value: 'markdown', label: 'Markdown Header Splitter' },
                    { value: 'sentence', label: 'Sentence / Paragraph Aware' },
                    { value: 'tabular', label: 'Tabular CSV & JSON Records' },
                  ]}
                />

                {/* Strategy Context Banner */}
                <div className="text-xs text-text-secondary leading-relaxed px-0.5">
                  {config.strategy === 'recursive' &&
                    'Recursively tries separators (\\n\\n, \\n, " ") to maintain document structure and paragraph boundaries.'}
                  {config.strategy === 'fixed' &&
                    'Strict character or token windowing with sliding overlap. Fast and simple.'}
                  {config.strategy === 'markdown' &&
                    'Splits hierarchically along Markdown headers (# H1, ## H2, etc.), preserving section context.'}
                  {config.strategy === 'sentence' &&
                    'Detects sentence termination punctuation (. ! ?) and preserves paragraphs intact.'}
                  {config.strategy === 'tabular' &&
                    'Preserves table columns and row schemas. Emits row-by-row chunks with column headers.'}
                </div>

                {config.strategy === 'recursive' && (
                  <div className="space-y-1.5">
                    <Input
                      label="Separators hierarchy"
                      value={separatorsText}
                      onChange={(e) => handleSeparatorsChange(e.target.value)}
                      placeholder='e.g. "\n\n", "\n", " ", ""'
                      helperText="Precedence order: largest delimiter to smallest"
                    />
                    {config.separators && config.separators.length > 0 && (
                      <button
                        onClick={handleResetSeparators}
                        className="text-xs text-accent hover:underline flex items-center gap-1 font-sans transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset to default separators
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-separator" />

          {/* SECTION 3: UNIT & TOKENIZER */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsTokenizerSectionOpen(!isTokenizerSectionOpen)}
              className="flex items-center justify-between text-left group focus-ring rounded-control -mx-1 px-2 min-h-[36px] py-1.5 transition-colors"
            >
              <span className="text-xs font-semibold text-text select-none">
                Unit &amp; tokenizer
              </span>
              <span className="text-text-tertiary group-hover:text-text transition-colors">
                {isTokenizerSectionOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>
            </button>

            {isTokenizerSectionOpen && (
              <div className="flex flex-col gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-secondary select-none">Measurement unit</label>
                  <SegmentedControl
                    options={[
                      { value: 'tokens', label: 'Tokens (BPE)' },
                      { value: 'chars', label: 'Characters' },
                    ]}
                    value={config.unit}
                    onChange={(val) => handleUnitToggle(val as ChunkUnit)}
                    ariaLabel="Measurement unit"
                  />
                </div>

                <Select
                  label="Tokenizer encoding"
                  value={config.encoding}
                  onChange={(e) =>
                    onChangeConfig({ ...config, encoding: e.target.value as TokenizerEncoding })
                  }
                  options={[
                    { value: 'o200k_base', label: 'o200k_base (OpenAI exact)' },
                    { value: 'cl100k_base', label: 'cl100k_base (OpenAI exact)' },
                  ]}
                  helperText="Only OpenAI encodings (o200k_base, cl100k_base) are exact. Claude, Gemini, Llama, and Cohere are estimates."
                />

                {/* Unified Tokenizer & Cost Comparison Trigger */}
                {onOpenTokenizerModal && (
                  <button
                    type="button"
                    onClick={onOpenTokenizerModal}
                    onMouseEnter={onPrefetchTokenizerModal}
                    onFocus={onPrefetchTokenizerModal}
                    className="w-full mt-1 h-8 px-2.5 rounded-control border border-separator bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text text-xs font-sans font-medium flex items-center justify-center space-x-1.5 transition-colors active-press focus-ring"
                    aria-label="Compare multi-model tokenizers and embedding costs"
                  >
                    <Cpu className="h-3.5 w-3.5 text-accent" />
                    <span>Compare models &amp; costs...</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-separator" />

          {/* SECTION 4: SIZE & OVERLAP */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setIsSizeSectionOpen(!isSizeSectionOpen)}
              className="flex items-center justify-between text-left group focus-ring rounded-control -mx-1 px-2 min-h-[36px] py-1.5 transition-colors"
            >
              <span className="text-xs font-semibold text-text select-none">
                Size &amp; overlap
              </span>
              <span className="text-text-tertiary group-hover:text-text transition-colors">
                {isSizeSectionOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>
            </button>

            {isSizeSectionOpen && (
              <div className="flex flex-col gap-4">
                <SliderWithInput
                  label="Target chunk size"
                  value={config.chunkSize}
                  min={sizeMin}
                  max={sizeMax}
                  step={sizeStep}
                  unitLabel={isTokens ? 'tok' : 'ch'}
                  onChange={(val) => onChangeConfig({ ...config, chunkSize: val })}
                />

                <SliderWithInput
                  label="Overlap window"
                  value={config.chunkOverlap}
                  min={overlapMin}
                  max={overlapMax}
                  step={overlapStep}
                  unitLabel={isTokens ? 'tok' : 'ch'}
                  onChange={(val) => onChangeConfig({ ...config, chunkOverlap: val })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  </>
  );
};
