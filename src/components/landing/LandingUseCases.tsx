import React, { useState } from 'react';
import {
  Briefcase,
  DollarSign,
  Code2,
  HeartPulse,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface LandingUseCasesProps {
  onLaunchApp: (sampleId?: string) => void;
}

export const LandingUseCases: React.FC<LandingUseCasesProps> = ({ onLaunchApp }) => {
  const [activeVertical, setActiveVertical] = useState<'legal' | 'finance' | 'code' | 'health'>('legal');

  const verticals = {
    legal: {
      id: 'legal',
      title: 'Legal Contracts & Master Service Agreements',
      sampleId: 'legal-saas-agreement',
      icon: <Briefcase className="h-4 w-4" />,
      tag: 'Legal Engineering',
      challenge:
        'Indemnification, limitation of liability, and governing law clauses often span 300–600 tokens. Standard splitters sever critical carve-outs and exceptions mid-sentence.',
      consequence:
        'When legal counsel or clients query "What are the exceptions to indemnity?", the retriever pulls a severed chunk and hallucinated advice follows.',
      solution:
        'Tune separator hierarchies to preserve entire numbered clauses ("Section ", "Clause ") with a measured 60-token overlap to ensure surrounding context travels with each obligation.',
      recommendedSettings: {
        strategy: 'Recursive Character',
        chunkSize: '400 tokens',
        overlap: '40 tokens (10%)',
        separators: '["\\n\\nSection", "\\n\\n", "\\n", " "]',
      },
    },
    finance: {
      id: 'finance',
      title: 'Quarterly Financial Earnings & 10-K Filings',
      sampleId: 'financial-10k-q3',
      icon: <DollarSign className="h-4 w-4" />,
      tag: 'Fintech & Equity Research',
      challenge:
        'Financial statements rely on strict table formatting and footnote disclosures. Standard character splitters sever column alignments and detach footnotes from corresponding figures.',
      consequence:
        'Financial analysts querying revenue breakdowns receive severed rows or figures missing crucial currency units and temporal qualifications.',
      solution:
        'Inspect Markdown and HTML table boundaries visually. Maintain table integrity by ensuring chunk sizes accommodate complete financial statements without breaking table rows.',
      recommendedSettings: {
        strategy: 'Markdown / Structure',
        chunkSize: '650 tokens',
        overlap: '50 tokens (7.6%)',
        separators: '["\\n\\n## ", "\\n\\n|", "\\n\\n"]',
      },
    },
    code: {
      id: 'code',
      title: 'Software Repositories & API Documentation',
      sampleId: 'python-backend-service',
      icon: <Code2 className="h-4 w-4" />,
      tag: 'Developer Platforms',
      challenge:
        'Source code files mix function signatures, docstrings, imports, and return blocks. Slicing in the middle of a class definition destroys AST comprehension.',
      consequence:
        'AI coding assistants generate broken functions and imaginary parameters because the import header or method definition was lost in an earlier partition.',
      solution:
        'Set custom delimiters around top-level function and class boundaries. Visually verify that code blocks and docstrings remain encapsulated in identical partitions.',
      recommendedSettings: {
        strategy: 'Recursive Character',
        chunkSize: '500 tokens',
        overlap: '50 tokens (10%)',
        separators: '["\\ndef ", "\\nclass ", "\\n\\n", "\\n"]',
      },
    },
    health: {
      id: 'health',
      title: 'Clinical Case Records & Medical Literature',
      sampleId: 'clinical-trial-report',
      icon: <HeartPulse className="h-4 w-4" />,
      tag: 'Healthcare & Life Sciences',
      challenge:
        'Patient records contain critical contraindications, dosage instructions, and allergy flags that must never be separated from the primary diagnostic entry.',
      consequence:
        'Severed clinical summaries risk omitting critical adverse interaction warnings during doctor query lookups.',
      solution:
        'Use strict zero-egress local processing to guarantee PHI never leaves the browser. Verify consecutive boundary continuity to ensure diagnostic context remains unbroken.',
      recommendedSettings: {
        strategy: 'Recursive Character',
        chunkSize: '350 tokens',
        overlap: '60 tokens (17%)',
        separators: '["\\n\\n[PATIENT", "\\n\\nDIAGNOSIS", "\\n\\n", "\\n"]',
      },
    },
  };

  const current = verticals[activeVertical];

  return (
    <div className="py-12 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-control bg-accent-subtle text-accent text-2xs font-mono font-semibold mb-3 border border-accent/25">
          <Briefcase className="h-3 w-3" />
          <span>Enterprise Archetypes</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-4">
          Engineered for High-Stakes RAG Workflows
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-sans">
          One bad chunk boundary in production can cause legal liability, erroneous financial guidance, or security bugs. See how developers calibrate ChunkLens for their domains.
        </p>
      </div>

      {/* Vertical Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {Object.values(verticals).map((v) => {
          const isActive = activeVertical === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveVertical(v.id as typeof activeVertical)}
              className={cn(
                'p-3.5 rounded-card text-left transition-all border flex flex-col justify-between focus-ring',
                isActive
                  ? 'bg-surface-1 border-accent shadow-card'
                  : 'bg-surface-1/60 hover:bg-surface-1 border-separator text-text-secondary hover:text-text'
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className={cn(
                    'h-7 w-7 rounded-control flex items-center justify-center shrink-0',
                    isActive ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary'
                  )}
                >
                  {v.icon}
                </div>
                <span className="text-2xs font-mono text-text-tertiary">{v.tag}</span>
              </div>
              <span className="text-xs font-semibold text-text line-clamp-1">{v.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Vertical Breakdown */}
      <div className="rounded-card border border-separator bg-surface-1 shadow-card p-6 sm:p-8 mb-16">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Details */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-control bg-surface-2 text-text-secondary text-2xs font-mono mb-2 border border-separator">
                <span>{current.tag}</span>
              </div>
              <h2 className="text-2xl font-bold text-text">{current.title}</h2>
            </div>

            {/* Problem & Risk */}
            <div className="p-4 rounded-control bg-status-warn-subtle border border-status-warn/25 space-y-2">
              <div className="flex items-center space-x-2 text-status-warn-text text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>The Boundary Failure Mode</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {current.challenge}
              </p>
              <p className="text-xs text-status-warn-text font-medium pt-1 border-t border-status-warn/20">
                <strong>Business Impact:</strong> {current.consequence}
              </p>
            </div>

            {/* Solution */}
            <div className="p-4 rounded-control bg-surface-2/60 border border-separator space-y-2">
              <div className="flex items-center space-x-2 text-accent text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>The ChunkLens Solution</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                {current.solution}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onLaunchApp(current.sampleId)}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              className="text-xs font-semibold"
            >
              <span>Test with {current.title.split(' ')[0]} Sample</span>
            </Button>
          </div>

          {/* Right Recommended Configuration Box */}
          <div className="w-full lg:w-80 p-5 rounded-control bg-surface-2/50 border border-separator space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-separator">
              <span className="font-semibold text-text">Recommended Parameters</span>
              <span className="text-2xs text-accent">Calibrated</span>
            </div>

            <div className="space-y-3 text-2xs">
              <div>
                <span className="text-text-tertiary block mb-0.5">Strategy Algorithm:</span>
                <span className="text-text font-semibold">{current.recommendedSettings.strategy}</span>
              </div>
              <div>
                <span className="text-text-tertiary block mb-0.5">Target Chunk Size:</span>
                <span className="text-text font-semibold">{current.recommendedSettings.chunkSize}</span>
              </div>
              <div>
                <span className="text-text-tertiary block mb-0.5">Overlap Window:</span>
                <span className="text-text font-semibold">{current.recommendedSettings.overlap}</span>
              </div>
              <div>
                <span className="text-text-tertiary block mb-0.5">Delimiter Priority:</span>
                <code className="text-2xs bg-surface-1 p-1.5 rounded-control border border-separator text-text-secondary block overflow-x-auto">
                  {current.recommendedSettings.separators}
                </code>
              </div>
            </div>

            <div className="pt-3 border-t border-separator text-2xs text-text-tertiary font-sans leading-relaxed">
              Export these exact parameters directly to Python (LangChain / LlamaIndex) with one click in the visualizer.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Proof Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-6 rounded-card border border-separator bg-surface-1 card-interactive">
          <div className="text-3xl font-bold text-accent font-mono mb-1">0%</div>
          <div className="text-xs font-semibold text-text mb-1">Data Egress</div>
          <div className="text-2xs text-text-secondary">Confidential files remain on client hardware</div>
        </div>
        <div className="p-6 rounded-card border border-separator bg-surface-1 card-interactive">
          <div className="text-3xl font-bold text-status-success-text font-mono mb-1">94.2%</div>
          <div className="text-xs font-semibold text-text mb-1">Boundary Continuity</div>
          <div className="text-2xs text-text-secondary">Measured topical coherence across partitions</div>
        </div>
        <div className="p-6 rounded-card border border-separator bg-surface-1 card-interactive">
          <div className="text-3xl font-bold text-text font-mono mb-1">38%</div>
          <div className="text-xs font-semibold text-text mb-1">Vector Storage Saved</div>
          <div className="text-2xs text-text-secondary">Eliminating redundant overlapping tokens</div>
        </div>
      </div>
    </div>
  );
};
