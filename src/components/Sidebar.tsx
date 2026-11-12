import React, { useRef, useState } from 'react';
import { ChunkingConfig, ChunkingStrategy, TokenizerEncoding, ChunkUnit } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { Upload, RotateCcw, FileText, Check, AlertCircle, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { SegmentedControl } from './ui/SegmentedControl';
import { SliderWithInput } from './ui/SliderWithInput';
import { detectFileFormat, isPdfBuffer, DetectedFormatInfo } from '../utils/fileFormatDetector';
import { useToast } from './ui/Toast';
import { cn } from '../utils/cn';

interface SidebarProps {
  config: ChunkingConfig;
  onChangeConfig: (newConfig: ChunkingConfig) => void;
  selectedSampleId: string | null;
  onSelectSample: (id: string) => void;
  onFileUpload: (text: string, filename: string, detectedFormat?: DetectedFormatInfo) => void;
  detectedFormat?: DetectedFormatInfo | null;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onChangeConfig,
  selectedSampleId,
  onSelectSample,
  onFileUpload,
  detectedFormat,
  isOpen,
  onClose,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

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

  const processUploadedFile = async (file: File) => {
    setUploadError(null);

    // Enforce 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      const msg = 'File exceeds 10 MB limit. Please select a smaller document.';
      setUploadError(msg);
      toastError('Upload Failed', msg);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || isPdfBuffer(buffer);

      if (isPdf) {
        setIsExtractingPdf(true);
        try {
          const { extractTextFromPdf } = await import('../utils/pdfParser');
          const result = await extractTextFromPdf(buffer.slice(0));
          if (!result.text.trim()) {
            const msg = `No readable text found in "${file.name}". Document might be a scanned image.`;
            setUploadError(msg);
            toastError('PDF Unreadable', msg);
            return;
          }
          const formatInfo: DetectedFormatInfo = {
            formatId: 'pdf',
            label: 'PDF Document',
            badge: 'PDF',
            extension: file.name.match(/\.[0-9a-z]+$/i)?.[0] || '.pdf',
            recommendedStrategy: 'recursive',
            confidence: 'high',
            description: `Extracted ${result.pageCount} pages with structural page markers.`,
          };
          onFileUpload(result.text, file.name, formatInfo);
          success(
            'Format Recognized: PDF Document',
            `Extracted ${result.pageCount} pages. Recommended algorithm: ${formatInfo.recommendedStrategy}.`
          );
        } finally {
          setIsExtractingPdf(false);
        }
        return;
      }

      // Read text content
      const content = new TextDecoder('utf-8').decode(buffer);
      if (!content || !content.trim()) {
        const msg = `Uploaded file "${file.name}" is empty.`;
        setUploadError(msg);
        toastError('Empty File', msg);
        return;
      }

      const formatInfo = detectFileFormat(file.name, content);
      onFileUpload(content, file.name, formatInfo);
      success(
        `Format Recognized: ${formatInfo.label}`,
        `Detected [${formatInfo.badge}]. Recommending ${formatInfo.recommendedStrategy} chunking.`
      );
    } catch (err) {
      const msg = `Failed to process "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`;
      setUploadError(msg);
      toastError('Processing Error', msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
    e.target.value = '';
  };

  const isTokens = config.unit === 'tokens';
  const sizeMin = isTokens ? 50 : 200;
  const sizeMax = isTokens ? 2048 : 8000;
  const sizeStep = isTokens ? 25 : 100;

  const overlapMin = 0;
  const overlapMax = isTokens ? 200 : 800;
  const overlapStep = isTokens ? 5 : 20;

  return (
    <>
      {/* Mobile/Tablet Backdrop (< 1024px) */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        aria-label="Configuration Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[300px] lg:static lg:z-auto shrink-0 border-r border-border-default bg-surface flex flex-col h-full overflow-y-auto select-none shadow-elevated lg:shadow-none animate-in slide-in-from-left duration-200 lg:animate-none',
          className
        )}
      >
        {/* Mobile Header Bar (< 1024px) */}
        <div className="flex items-center justify-between p-3 border-b border-border-default lg:hidden bg-elevated/50">
          <span className="text-xs font-semibold text-text-primary">Configuration</span>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface active-press focus-ring transition-colors"
            aria-label="Close configuration drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-5 text-xs">
        {/* SECTION 1: SOURCE */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-text-tertiary tracking-wider">
              Document Source
            </span>
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
                    'flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors active-press focus-ring',
                    isSelected
                      ? 'bg-elevated text-text-primary font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-elevated/50'
                  )}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="h-3 w-3 shrink-0 text-text-tertiary" />
                    <span className="truncate text-xs">{sample.title}</span>
                  </div>
                  {isSelected && <Check className="h-3 w-3 text-accent shrink-0 ml-1" />}
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
              if (file) processUploadedFile(file);
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
              className="w-full"
            >
              {isExtractingPdf
                ? 'Extracting PDF...'
                : isDraggingFile
                ? 'Drop file here to detect format'
                : 'Upload or Drop File (.md, .csv, .pdf, .json)'}
            </Button>
          </div>

          {/* Active Detected Format Indicator */}
          {detectedFormat && !selectedSampleId && (
            <div className="p-2 rounded bg-elevated border border-border-subtle flex items-center justify-between text-[11px] font-mono select-none">
              <span className="text-text-secondary">Detected Format:</span>
              <span className="px-1.5 py-0.2 rounded bg-surface border border-border-default text-accent font-semibold flex items-center gap-1">
                <span>{detectedFormat.badge}</span>
                <span className="text-text-tertiary font-normal">({detectedFormat.label})</span>
              </span>
            </div>
          )}

          {/* Upload Error Banner with Recovery */}
          {uploadError && (
            <div className="p-2.5 rounded bg-status-error/10 border border-status-error/20 text-status-error flex items-start gap-2 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{uploadError}</p>
                <button
                  onClick={() => setUploadError(null)}
                  className="mt-1 text-[10px] underline hover:no-underline text-text-secondary"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-border-subtle" />

        {/* SECTION 2: CHUNKING STRATEGY */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-mono uppercase text-text-tertiary tracking-wider">
            Chunking Strategy
          </span>

          <Select
            label="Algorithm"
            value={config.strategy}
            onChange={(e) =>
              onChangeConfig({ ...config, strategy: e.target.value as ChunkingStrategy })
            }
            options={[
              { value: 'recursive', label: 'Recursive Character (LangChain)' },
              { value: 'fixed', label: 'Fixed Size (Character/Token Slicing)' },
              { value: 'markdown', label: 'Markdown Header Structure' },
              { value: 'sentence', label: 'Sentence Boundary (NLP)' },
              { value: 'tabular', label: 'Tabular CSV & JSON Records' },
            ]}
          />

          {/* Custom Delimiters for Recursive Strategy */}
          {config.strategy === 'recursive' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-custom-separators"
                  className="text-xs font-medium text-text-secondary select-none"
                >
                  Separators Hierarchy
                </label>
                {config.separators && (
                  <button
                    onClick={handleResetSeparators}
                    className="text-[10px] text-text-tertiary hover:text-text-primary flex items-center space-x-0.5 focus-ring rounded"
                    title="Reset to default delimiters"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <Input
                id="input-custom-separators"
                placeholder='e.g. "\n\n", "\n", " ", ""'
                value={separatorsText}
                onChange={(e) => handleSeparatorsChange(e.target.value)}
                helperText='Precedence order: largest delimiter to smallest'
              />
            </div>
          )}
        </div>

        <div className="h-px bg-border-subtle" />

        {/* SECTION 3: UNIT & ENCODING */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-mono uppercase text-text-tertiary tracking-wider">
            Unit & Tokenizer
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-secondary select-none">
              Measurement Unit
            </span>
            <SegmentedControl
              options={[
                { value: 'tokens', label: 'Tokens (BPE)' },
                { value: 'characters', label: 'Characters' },
              ]}
              value={config.unit}
              onChange={handleUnitToggle}
              size="sm"
              ariaLabel="Measurement unit"
            />
          </div>

          <Select
            label="Tokenizer Encoding"
            value={config.encoding}
            onChange={(e) =>
              onChangeConfig({ ...config, encoding: e.target.value as TokenizerEncoding })
            }
            options={[
              { value: 'o200k_base', label: 'OpenAI GPT-4o / mini (o200k)' },
              { value: 'cl100k_base', label: 'OpenAI GPT-4 / Ada (cl100k)' },
            ]}
          />
        </div>

        <div className="h-px bg-border-subtle" />

        {/* SECTION 4: SIZE & OVERLAP */}
        <div className="flex flex-col gap-4">
          <span className="text-[11px] font-mono uppercase text-text-tertiary tracking-wider">
            Size & Overlap
          </span>

          <SliderWithInput
            label="Target Chunk Size"
            value={config.chunkSize}
            min={sizeMin}
            max={sizeMax}
            step={sizeStep}
            unitLabel={isTokens ? 'tok' : 'ch'}
            onChange={(val) => onChangeConfig({ ...config, chunkSize: val })}
          />

          <SliderWithInput
            label="Overlap Window"
            value={config.chunkOverlap}
            min={overlapMin}
            max={overlapMax}
            step={overlapStep}
            unitLabel={isTokens ? 'tok' : 'ch'}
            onChange={(val) => onChangeConfig({ ...config, chunkOverlap: val })}
          />
        </div>
      </div>
    </aside>
    </>
  );
};
