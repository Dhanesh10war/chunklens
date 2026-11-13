import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, X, Check, Copy } from 'lucide-react';
import { cn } from '../utils/cn';

interface PrivacyPopoverProps {
  className?: string;
}

export const PrivacyPopover: React.FC<PrivacyPopoverProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyVerification = async () => {
    const text = `// ChunkLens Zero-Egress Verification in DevTools:
1. Press F12 -> Network tab
2. Filter by 'Fetch/XHR' or 'All'
3. Upload documents, adjust chunk sizes, export code
4. Notice 0 external requests (all requests are strictly local 127.0.0.1 or origin)
5. Inspect <meta http-equiv="Content-Security-Policy">: connect-src 'none'`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={cn('relative inline-flex items-center', className)} ref={popoverRef}>
      {/* Trigger Button: Full text >= 1200px, Icon-only < 1200px */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="100% client-side · zero network egress (Click for verification guide)"
        className="flex items-center space-x-1.5 h-7 px-2 rounded-md hover:bg-elevated text-text-tertiary hover:text-text-primary text-xs font-mono transition-colors active-press focus-ring"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-status-success shrink-0" />
        <span className="hidden min-[1200px]:inline">100% client-side · zero network egress</span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Privacy & Zero Network Egress Verification"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 rounded-lg bg-surface border border-border-default shadow-modal p-4 z-50 text-xs font-sans text-text-secondary animate-in fade-in duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
            <div className="flex items-center space-x-2 text-text-primary font-semibold text-sm">
              <ShieldCheck className="h-4 w-4 text-status-success" />
              <span>Zero Network Egress</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-elevated transition-colors"
              aria-label="Close verification popover"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Proof points */}
          <div className="mt-3 space-y-2.5">
            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success mt-1.5 shrink-0" />
              <p>
                <strong className="text-text-primary font-medium">Strict Content Security Policy:</strong>{' '}
                Production enforces <code className="px-1 py-0.5 rounded bg-elevated font-mono text-xs text-text-primary">connect-src 'none'</code>, mathematically preventing any outbound fetch, XHR, WebSockets, or telemetry beacons.
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success mt-1.5 shrink-0" />
              <p>
                <strong className="text-text-primary font-medium">100% Self-Hosted Assets:</strong> All Inter & JetBrains Mono font files and PDF.js workers are bundled locally in the build. Zero queries to Google Fonts or third-party CDNs.
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success mt-1.5 shrink-0" />
              <p>
                <strong className="text-text-primary font-medium">Offline Air-Gap Ready:</strong> Turn off Wi-Fi or enable Airplane Mode. Chunking, BPE tokenization, and vector similarity continue running at full speed in your local Web Worker.
              </p>
            </div>
          </div>

          {/* How to verify in DevTools */}
          <div className="mt-3.5 pt-3 border-t border-border-subtle bg-elevated/40 rounded p-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-text-primary mb-1">
              <span>How to verify in DevTools:</span>
              <button
                onClick={handleCopyVerification}
                className="flex items-center space-x-1 text-xs text-accent hover:underline font-mono"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy steps'}</span>
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-xs text-text-tertiary">
              <li>Open Browser DevTools (<kbd className="font-mono">F12</kbd> or <kbd className="font-mono">⌘⌥I</kbd>)</li>
              <li>Switch to the <strong className="text-text-secondary">Network</strong> tab</li>
              <li>Upload a file or toggle chunk sizes</li>
              <li>Confirm 0 external network requests are made</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
