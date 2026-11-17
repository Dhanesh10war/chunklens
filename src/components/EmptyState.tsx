import React, { useState, useRef } from 'react';
import {
  Upload,
  ClipboardPaste,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { RAG_ARCHETYPES } from '../data/archetypes';
import { ChunkingConfig } from '../engine/types';
import { UploadErrorInfo } from '../hooks/useDocumentUpload';
import { UploadErrorBanner } from './UploadErrorBanner';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

interface EmptyStateProps {
  onSelectSample: (sampleId: string) => void;
  onFileUpload: (file: File) => void;
  onPasteText: (text: string, title?: string) => void;
  uploadError: UploadErrorInfo | null;
  onDismissError: () => void;
  isExtractingPdf?: boolean;
  onSelectArchetype?: (config: ChunkingConfig, sampleId?: string) => void;
  activeConfig?: ChunkingConfig;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSample,
  onFileUpload,
  onPasteText,
  uploadError,
  onDismissError,
  isExtractingPdf = false,
  onSelectArchetype,
  activeConfig,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [calibratedName, setCalibratedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;
    onPasteText(pastedText.trim(), 'Pasted Document');
    setPastedText('');
    setIsPasting(false);
  };

  const handleCalibrateForUpload = (name: string, config: ChunkingConfig) => {
    setCalibratedName(name);
    if (onSelectArchetype) {
      onSelectArchetype(config);
    }
  };

  return (
    <section
      role="region"
      aria-label="Document setup and sample selection"
      className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start bg-bg-base text-text-primary"
    >
      <div className="max-w-4xl w-full space-y-6 my-auto">
        {/* Error Banner (if file upload failed) */}
        {uploadError && (
          <UploadErrorBanner
            error={uploadError}
            onDismiss={onDismissError}
            onChooseAnotherFile={() => fileInputRef.current?.click()}
            className="w-full"
          />
        )}

        {/* Hero Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-status-success-subtle text-status-success-text border border-status-success/20 select-none">
            <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
            <span>100% client-side · zero network egress</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Document Chunking &amp; RAG Cost Workbench
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto">
            Test, compare, and optimize chunking strategies, inspect token splits, and measure embedding costs across frontier LLMs.
          </p>
        </div>

        {/* Primary Upload Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'group relative border-2 border-dashed rounded-panel p-6 sm:p-8 text-center cursor-pointer transition-all select-none',
            isDragOver
              ? 'border-accent bg-accent-subtle/30 scale-[1.005]'
              : 'border-separator hover:border-separator/80 bg-surface-1/40 hover:bg-surface-1/70'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.markdown,.csv,.tsv,.json,.txt,.py,.ts,.js,.tsx,.jsx,.html,.css,.yaml,.yml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileUpload(file);
                e.target.value = '';
              }
            }}
            className="hidden"
            id="empty-state-file-input"
            aria-label="File upload input"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
              <Upload className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              {calibratedName && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-2 text-text border border-separator text-xs font-mono mb-1">
                  <Check className="h-3 w-3 text-status-success-text" />
                  <span>Calibrated for: {calibratedName}</span>
                </div>
              )}
              <p className="text-sm font-semibold text-text-primary">
                {isExtractingPdf ? (
                  'Extracting text from PDF in browser...'
                ) : (
                  <>
                    <span className="hidden [@media(pointer:coarse)]:inline">Tap to choose a file</span>
                    <span className="inline [@media(pointer:coarse)]:hidden">Drop your document here, or click to browse</span>
                  </>
                )}
              </p>
              <p className="text-xs text-text-secondary">
                Supported formats: <span className="font-mono text-text-primary">.pdf, .md, .csv, .json, .txt, .py, .ts, .js</span>
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-xs mt-1"
            >
              Choose file
            </Button>

            <div className="flex flex-col items-center gap-0.5 text-xs text-text-tertiary font-mono pt-1">
              <span>Limit: 10 MB</span>
              <span>Automatic format recognition</span>
            </div>
          </div>
        </div>

        {/* PRODUCTION RAG ARCHETYPE PRESETS */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>Production RAG Archetype Presets</span>
              </h3>
              <p className="text-2xs text-text-secondary">
                Calibrated token budgets and splitters for standard vector database workloads.
              </p>
            </div>
            <span className="text-2xs text-text-tertiary font-mono hidden sm:inline">
              Pre-tuned splitters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RAG_ARCHETYPES.map((archetype) => {
              const isCalibrated =
                calibratedName === archetype.name ||
                (activeConfig &&
                  activeConfig.strategy === archetype.config.strategy &&
                  activeConfig.chunkSize === archetype.config.chunkSize);

              return (
                <div
                  key={archetype.id}
                  className={cn(
                    'p-4 rounded-card border bg-surface-1/60 hover:bg-surface-1 transition-all flex flex-col justify-between shadow-subtle',
                    isCalibrated
                      ? 'border-accent/60 ring-1 ring-accent/30'
                      : 'border-separator hover:border-separator/80'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          <span>{archetype.name}</span>
                        </h4>
                        <span className="text-2xs text-text-tertiary font-mono">
                          {archetype.targetWorkload}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-mono font-semibold bg-surface-2 border border-separator text-text shrink-0">
                        {archetype.badge}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {archetype.description}
                    </p>

                    {/* Calibrated Params Strip */}
                    <div className="flex items-center flex-wrap gap-1.5 pt-1 text-2xs font-mono text-text-secondary">
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator/60">
                        {archetype.config.chunkSize} tok
                      </span>
                      <span className="text-text-tertiary">•</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator/60">
                        {archetype.config.chunkOverlap} ovl
                      </span>
                      <span className="text-text-tertiary">•</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-separator/60 capitalize">
                        {archetype.config.strategy}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-separator/40 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectArchetype) {
                          onSelectArchetype(archetype.config, archetype.sampleId);
                        } else {
                          onSelectSample(archetype.sampleId);
                        }
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-control bg-accent text-white hover:bg-accent-hover text-2xs font-semibold transition-colors active-press focus-ring flex items-center justify-center gap-1 shadow-subtle"
                    >
                      <span>Load Benchmark Corpus</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalibrateForUpload(archetype.name, archetype.config)}
                      className={cn(
                        'py-1.5 px-2.5 rounded-control border text-2xs transition-colors active-press focus-ring flex items-center justify-center gap-1 shrink-0 font-medium',
                        isCalibrated
                          ? 'bg-surface-3 text-text border-accent font-semibold'
                          : 'bg-surface-2 hover:bg-surface-3 text-text border-separator'
                      )}
                    >
                      <Sliders className="h-3 w-3 text-accent" />
                      <span>{isCalibrated ? 'Calibrated' : 'Calibrate Upload'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Paste Text Collapsible Toggle */}
        <div className="border border-separator rounded-card bg-surface-1/40 p-3">
          {!isPasting ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-text-secondary min-w-0">
                <ClipboardPaste className="h-4 w-4 text-text-tertiary shrink-0" />
                <span className="whitespace-nowrap">Have a snippet?</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPasting(true)}
                className="text-xs shrink-0 whitespace-nowrap"
              >
                Paste text
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasteSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="pasted-text-input" className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                  <ClipboardPaste className="h-3.5 w-3.5 text-accent" />
                  <span>Paste text or code snippet:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsPasting(false)}
                  className="text-text-tertiary hover:text-text-primary text-xs hover:underline"
                >
                  Cancel
                </button>
              </div>
              <textarea
                id="pasted-text-input"
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste markdown, source code, JSON, CSV, or raw paragraphs here..."
                className="w-full text-xs font-mono p-3 rounded bg-bg-base border border-border-default text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary font-mono text-xs tabular-nums">
                  {pastedText.length.toLocaleString()} characters
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!pastedText.trim()}
                  icon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Load Snippet
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Sample Corpora Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-primary">
              Or start with a sample corpus
            </h3>
            <span className="text-xs text-text-tertiary font-mono">
              6 bundled benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAMPLE_DOCUMENTS.map((sample) => {
              const byteSize = new TextEncoder().encode(sample.content).length;
              const formattedSize =
                byteSize >= 1024 ? `${(byteSize / 1024).toFixed(1)} KB` : `${byteSize} B`;

              return (
                <div
                  key={sample.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Load sample: ${sample.title}`}
                  onClick={() => onSelectSample(sample.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSample(sample.id);
                    }
                  }}
                  className="group p-3.5 rounded-card border border-separator hover:border-accent/40 bg-surface-1/70 hover:bg-surface-2 transition-all cursor-pointer flex flex-col justify-between text-left focus-ring shadow-subtle"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                        {sample.title}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-surface border border-border-default text-text-tertiary shrink-0 tabular-nums">
                        {formattedSize}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border-subtle text-xs text-text-tertiary font-mono">
                    <span className="truncate">{sample.category}</span>
                    <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Load <ArrowRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
