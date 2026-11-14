import React, { useState, useRef } from 'react';
import {
  Upload,
  ClipboardPaste,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/samples';
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
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSample,
  onFileUpload,
  onPasteText,
  uploadError,
  onDismissError,
  isExtractingPdf = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start bg-bg-base text-text-primary">
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-accent-subtle text-accent border border-accent/20 select-none">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>100% Client-Side · Zero Network Egress</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Document Chunking &amp; RAG Cost Workbench
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto">
            Test, compare, and optimize chunking strategies, inspect token splits, and measure embedding costs across frontier LLMs.
          </p>
        </div>

        {/* Primary Upload Dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload document dropzone: drop files or click to browse"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'group relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all select-none focus-ring',
            isDragOver
              ? 'border-accent bg-accent-subtle/30 scale-[1.005]'
              : 'border-border-default hover:border-border-strong bg-surface/40 hover:bg-surface/70'
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
              <p className="text-sm font-semibold text-text-primary">
                {isExtractingPdf ? 'Extracting text from PDF in browser...' : 'Drop your document here, or click to browse'}
              </p>
              <p className="text-xs text-text-secondary">
                Supported formats: <span className="font-mono text-text-primary">.pdf, .md, .csv, .json, .txt, .py, .ts, .js</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-text-tertiary font-mono pt-1">
              <span>Limit: 10 MB</span>
              <span>·</span>
              <span>Automatic format recognition</span>
              <span>·</span>
              <span className="text-status-success flex items-center gap-1">
                <Check className="h-3 w-3" />
                Files never leave your browser
              </span>
            </div>
          </div>
        </div>

        {/* Paste Text Collapsible Toggle */}
        <div className="border border-border-default rounded-lg bg-surface/30 p-3">
          {!isPasting ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <ClipboardPaste className="h-4 w-4 text-text-tertiary" />
                <span>Need to inspect a quick snippet or raw prompt?</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPasting(true)}
                className="text-xs"
              >
                Paste Raw Text
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
                <span className="text-text-tertiary font-mono text-xs">
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
            <h2 className="text-xs font-semibold text-text-primary">
              Or start with a sample corpus
            </h2>
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
                  className="group p-3.5 rounded-lg border border-border-default hover:border-accent bg-surface/50 hover:bg-elevated transition-all cursor-pointer flex flex-col justify-between text-left focus-ring"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                        {sample.title}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-surface border border-border-default text-text-tertiary shrink-0">
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
    </div>
  );
};
