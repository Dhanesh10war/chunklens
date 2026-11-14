import React, { useState } from 'react';
import { AlertCircle, X, FolderOpen, Copy, Check } from 'lucide-react';
import { UploadErrorInfo } from '../hooks/useDocumentUpload';
import { copyToClipboard } from '../utils/clipboard';
import { cn } from '../utils/cn';

interface UploadErrorBannerProps {
  error: UploadErrorInfo;
  onDismiss: () => void;
  onChooseAnotherFile?: () => void;
  className?: string;
}

export const UploadErrorBanner: React.FC<UploadErrorBannerProps> = ({
  error,
  onDismiss,
  onChooseAnotherFile,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyDetails = async () => {
    if (error.technicalDetail) {
      const ok = await copyToClipboard(error.technicalDetail);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'p-3 rounded-md bg-status-danger/10 border border-status-danger/30 border-l-2 border-l-status-danger text-text-primary text-xs flex flex-col gap-2 font-sans',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-status-danger shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-status-danger break-words leading-snug">
            Failed to process &ldquo;{error.failedFilename}&rdquo;
          </p>
          <p className="text-text-secondary text-xs mt-0.5 break-words leading-relaxed">
            {error.reason}
          </p>
          {error.retainedDocTitle && (
            <p className="text-text-tertiary text-xs mt-1 italic">
              Still displaying: &ldquo;{error.retainedDocTitle}&rdquo;
            </p>
          )}

          {error.technicalDetail && (
            <div className="mt-2 p-2 rounded bg-surface/90 border border-status-danger/20 flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-text-tertiary">
                <span>Technical detail:</span>
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-sans"
                >
                  {copied ? <Check className="h-2.5 w-2.5 text-status-success" /> : <Copy className="h-2.5 w-2.5" />}
                  <span>{copied ? 'Copied' : 'Copy detail'}</span>
                </button>
              </div>
              <pre className="text-text-secondary whitespace-pre-wrap break-all select-all max-h-24 overflow-y-auto">
                {error.technicalDetail}
              </pre>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-text-tertiary hover:text-text-primary p-0.5 rounded hover:bg-surface focus-ring transition-colors shrink-0"
          title="Dismiss alert"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {onChooseAnotherFile && (
        <div className="flex items-center gap-2 pt-1 border-t border-status-danger/20">
          <button
            onClick={onChooseAnotherFile}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded bg-status-danger/20 hover:bg-status-danger/30 text-text-primary transition-colors focus-ring"
          >
            <FolderOpen className="h-3 w-3" />
            <span>Choose another file</span>
          </button>
        </div>
      )}
    </div>
  );
};
