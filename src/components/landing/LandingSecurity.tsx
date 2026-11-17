import React, { useState } from 'react';
import {
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  ServerOff,
  Cpu,
  ArrowRight,
  EyeOff,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface LandingSecurityProps {
  onLaunchApp: () => void;
}

export const LandingSecurity: React.FC<LandingSecurityProps> = ({ onLaunchApp }) => {
  const [copiedCurl, setCopiedCurl] = useState(false);

  const curlTest = `curl -sI https://chunklens.app | grep -i content-security-policy
# Expected response header:
# Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data: blob:; worker-src 'self' blob:;`;

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlTest);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-control bg-status-success-subtle text-status-success-text text-2xs font-mono font-semibold mb-3 border border-status-success/25">
          <ShieldCheck className="h-3 w-3" />
          <span>Security Architecture Specification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-4">
          True Zero-Egress. Your Data Never Leaves Your Machine.
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
          Most RAG tools upload your proprietary documents to cloud APIs for processing. ChunkLens is built from first principles as an air-gapped client-side application.
        </p>
      </div>

      {/* 3 Core Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between card-interactive">
          <div>
            <div className="h-10 w-10 rounded-control bg-status-success-subtle border border-status-success/25 flex items-center justify-center text-status-success mb-4">
              <ServerOff className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-text mb-2">Hardwired CSP: connect-src 'none'</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Our Content Security Policy instructs the browser engine to physically deny all outbound network connections. No fetch, no XMLHttpRequest, and no WebSockets can execute.
            </p>
          </div>
          <div className="pt-3 border-t border-separator font-mono text-2xs text-status-success-text">
            Enforced by browser sandbox
          </div>
        </div>

        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between card-interactive">
          <div>
            <div className="h-10 w-10 rounded-control bg-accent-subtle border border-accent/25 flex items-center justify-center text-accent mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-text mb-2">Sandboxed Web Worker Execution</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              All PDF parsing, TikToken BPE tokenization, and vector cosine calculations run in an isolated Web Worker thread with zero DOM access or network capability.
            </p>
          </div>
          <div className="pt-3 border-t border-separator font-mono text-2xs text-text-secondary">
            Multi-threaded client compute
          </div>
        </div>

        <div className="p-6 rounded-card border border-separator bg-surface-1 shadow-subtle flex flex-col justify-between card-interactive">
          <div>
            <div className="h-10 w-10 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-text mb-4">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-text mb-2">Zero Tracking or Analytics</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              No tracking cookies, no Google Analytics, no third-party scripts, and no server telemetry. What you paste into ChunkLens exists only in local RAM.
            </p>
          </div>
          <div className="pt-3 border-t border-separator font-mono text-2xs text-text-secondary">
            100% ephemeral local storage
          </div>
        </div>
      </div>

      {/* Interactive Verification Section */}
      <div className="rounded-card border border-separator bg-surface-1 shadow-card p-6 sm:p-8 mb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-1.5 text-2xs font-mono text-accent mb-2 font-semibold">
            <Terminal className="h-3.5 w-3.5" />
            <span>Independent Verification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text mb-3">
            Verify Our Claims in 30 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 font-sans">
            Don't trust marketing copy. Audit our Content Security Policy headers directly from your terminal or open your browser's Developer Tools Network tab during document processing.
          </p>
        </div>

        {/* Copyable Curl Box */}
        <div className="rounded-control bg-surface-2 border border-separator p-4 font-mono text-xs text-text-secondary relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-separator text-2xs text-text-tertiary">
            <span>Terminal Verification Command</span>
            <button
              type="button"
              onClick={handleCopyCurl}
              className="flex items-center space-x-1 text-accent hover:text-accent/80 transition-colors focus-ring rounded px-1"
            >
              {copiedCurl ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Shell Command</span>
                </>
              )}
            </button>
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-label="CSP Verification Shell Command"
            className="overflow-x-auto whitespace-pre leading-relaxed select-all text-2xs sm:text-xs focus-ring rounded"
          >
            {curlTest}
          </pre>
        </div>
      </div>

      {/* Enterprise Compliance Readiness */}
      <div className="p-8 rounded-card border border-separator bg-surface-2/30">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h3 className="text-lg font-bold text-text mb-1">Enterprise Compliance Ready</h3>
          <p className="text-xs text-text-secondary">
            Designed to pass stringent enterprise security reviews without requiring complex cloud DPAs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-control bg-surface-1 border border-separator card-interactive">
            <div className="font-semibold text-text mb-1">SOC 2 Type II</div>
            <div className="text-2xs text-text-secondary leading-relaxed">
              Data processing boundary remains strictly on your client workstation.
            </div>
          </div>
          <div className="p-4 rounded-control bg-surface-1 border border-separator card-interactive">
            <div className="font-semibold text-text mb-1">HIPAA Compatible</div>
            <div className="text-2xs text-text-secondary leading-relaxed">
              Zero Protected Health Information (PHI) is ever transmitted over the wire.
            </div>
          </div>
          <div className="p-4 rounded-control bg-surface-1 border border-separator card-interactive">
            <div className="font-semibold text-text mb-1">GDPR / CCPA</div>
            <div className="text-2xs text-text-secondary leading-relaxed">
              No personal data collected, stored, or processed on remote infrastructure.
            </div>
          </div>
          <div className="p-4 rounded-control bg-surface-1 border border-separator card-interactive">
            <div className="font-semibold text-text mb-1">Air-Gapped Friendly</div>
            <div className="text-2xs text-text-secondary leading-relaxed">
              Fully functional behind enterprise corporate firewalls and VPNs with zero network access.
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="primary"
            size="md"
            onClick={onLaunchApp}
            icon={<ArrowRight className="h-4 w-4" />}
            className="text-xs font-semibold px-6 shadow-card"
          >
            <span>Launch Zero-Egress Visualizer</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
