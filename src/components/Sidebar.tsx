import React, { useRef, useState } from 'react';
import { ChunkingConfig, ChunkingStrategy, TokenizerEncoding, ChunkUnit } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { Upload, RotateCcw, FileText, Check, FilePlus, Cpu } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { SegmentedControl } from './ui/SegmentedControl';
import { SliderWithInput } from './ui/SliderWithInput';
import { DetectedFormatInfo } from '../utils/fileFormatDetector';
import { UploadErrorInfo } from '../hooks/useDocumentUpload';
import { UploadErrorBanner } from './UploadErrorBanner';
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
  uploadError?: UploadErrorInfo | null;
  onDismissError?: () => void;
  isExtractingPdf?: boolean;
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
  uploadError,
  onDismissError,
  isExtractingPdf = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [separatorsText, setSeparatorsText] = useState<string>(
    config.separators ? config.separators.map((s) => JSON.stringify(s)).join(', ') : ''
  );

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
    <aside
      className={cn(
        'w-full sm:w-[320px] bg-surface border-r border-border-default flex flex-col h-full shrink-0 select-none overflow-y-auto z-20',
        className
      )}
    >
      <div className="flex flex-col flex-1 pb-8">
        {/* Mobile Header / Close Bar */}
        <div className="flex items-center justify-between p-3 border-b border-border-subtle lg:hidden">
          <span className="font-semibold text-xs text-text-primary">
            Configuration
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-elevated text-text-secondary hover:text-text-primary text-xs focus-ring"
            aria-label="Close configuration drawer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 flex flex-col gap-5 text-xs">
          {/* SECTION 1: SOURCE */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-text-primary">
                Document source
              </span>
              {onNewDocument && (
                <button
                  onClick={onNewDocument}
                  className="inline-flex items-center gap-1 text-xs font-sans text-accent hover:text-accent-hover hover:underline focus-ring rounded px-1"
                  title="Clear document and open empty dropzone"
                  aria-label="New document: clear canvas"
                >
                  <FilePlus className="h-3.5 w-3.5" />
                  <span>New document</span>
                </button>
              )}
            </div>

            {/* Sample Corpora Selection */}
            <div className="flex flex-col gap-1 border border-border-default rounded-md bg-base p-1">
              {SAMPLE_DOCUMENTS.map((sample) => {
                const isSelected = sample.id === selectedSampleId;
                return (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample.id)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors active-press focus-ring text-xs',
                      isSelected
                        ? 'bg-elevated text-text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'
                    )}
                  >
                    <div className="flex items-center space-x-2 truncate min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{sample.title}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0 ml-1" />}
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
                'rounded-md transition-all',
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
              <div className="p-2 rounded bg-elevated border border-border-subtle flex items-center justify-between text-xs select-none">
                <span className="text-text-secondary">Detected format:</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border-default text-accent font-medium font-mono flex items-center gap-1 text-xs">
                  <span>{detectedFormat.badge}</span>
                  <span className="text-text-tertiary font-normal">({detectedFormat.label})</span>
                </span>
              </div>
            )}

            {/* Upload Error Banner with Recovery */}
            {uploadError && (
              <UploadErrorBanner
                error={uploadError}
                onDismiss={onDismissError || (() => {})}
                onChooseAnotherFile={() => fileInputRef.current?.click()}
                className="mt-1"
              />
            )}
          </div>

          <div className="h-px bg-border-subtle" />

          {/* SECTION 2: CHUNKING STRATEGY */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-text-primary">
              Chunking strategy
            </span>

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
            <div className="text-xs text-text-tertiary leading-relaxed p-2 rounded bg-elevated border border-border-subtle">
              {config.strategy === 'recursive' &&
                'Recursively tries separators (\\n\\n, \\n, " ") to maintain semantic boundary structure.'}
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
                    className="text-xs text-accent hover:underline flex items-center gap-1 font-sans"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to default separators
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-border-subtle" />

          {/* SECTION 3: UNIT & TOKENIZER */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-text-primary">
              Unit &amp; tokenizer
            </span>

            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Measurement unit</label>
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
                { value: 'o200k_base', label: 'OpenAI GPT-4o / mini (o200k)' },
                { value: 'cl100k_base', label: 'OpenAI GPT-4 / text-embedding-3 (cl100k)' },
                { value: 'p50k_base', label: 'OpenAI Codex / Davinci (p50k)' },
                { value: 'r50k_base', label: 'OpenAI GPT-3 / GPT-2 (r50k)' },
              ]}
              helperText="Token estimates in inspector and comparison table will use this model."
            />

            {/* Unified Tokenizer & Cost Comparison Trigger */}
            {onOpenTokenizerModal && (
              <button
                type="button"
                onClick={onOpenTokenizerModal}
                onMouseEnter={onPrefetchTokenizerModal}
                onFocus={onPrefetchTokenizerModal}
                className="w-full mt-1 h-7 px-2.5 rounded border border-border-default bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary text-xs font-sans font-medium flex items-center justify-center space-x-1.5 transition-colors active-press focus-ring"
                aria-label="Compare multi-model tokenizers and embedding costs"
              >
                <Cpu className="h-3.5 w-3.5 text-accent" />
                <span>Compare models &amp; costs...</span>
              </button>
            )}
          </div>

          <div className="h-px bg-border-subtle" />

          {/* SECTION 4: SIZE & OVERLAP */}
          <div className="flex flex-col gap-4">
            <span className="text-[13px] font-semibold text-text-primary">
              Size &amp; overlap
            </span>

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
        </div>
      </div>
    </aside>
  );
};
