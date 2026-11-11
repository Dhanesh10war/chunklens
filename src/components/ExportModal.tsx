import React, { useState } from 'react';
import { ChunkMetadata, ChunkingConfig, CodeExportFramework } from '../engine/types';
import { generateExportCode } from '../exporters/codeExporters';
import { exportChunksToJson, exportChunksToCsv, downloadFile } from '../exporters/dataExporters';
import { copyToClipboard } from '../utils/clipboard';
import { X, Copy, Check, Terminal, FileJson, FileSpreadsheet, Code2, Cpu, Boxes, FileCode } from 'lucide-react';
import { cn } from '../utils/cn';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChunkingConfig;
  chunks?: ChunkMetadata[];
  docTitle?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  chunks = [],
  docTitle = 'document',
}) => {
  const [activeTab, setActiveTab] = useState<CodeExportFramework>('langchain-python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = generateExportCode(config, activeTab);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = exportChunksToJson(chunks, config, docTitle);
    const safeTitle = docTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    downloadFile(jsonStr, `${safeTitle}_chunks_${config.strategy}.json`, 'application/json');
  };

  const handleDownloadCsv = () => {
    const csvStr = exportChunksToCsv(chunks);
    const safeTitle = docTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    downloadFile(csvStr, `${safeTitle}_chunks_${config.strategy}.csv`, 'text/csv');
  };

  const tabs: { id: CodeExportFramework; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'langchain-python', label: 'LangChain (Python)', icon: Code2 },
    { id: 'llamaindex-python', label: 'LlamaIndex (Python)', icon: Cpu },
    { id: 'langchain-js', label: 'LangChain.js (TS)', icon: FileCode },
    { id: 'native-python', label: 'Native Python (0 Deps)', icon: Boxes },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
      <div className="bg-panel border border-border rounded-lg w-full max-w-3xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm tracking-tight">Export Pipeline Code & Datasets</h3>
              <p className="text-xs text-slate-400">
                Production-ready code snippets or export <span className="font-mono text-slate-300 tabular-nums">{chunks.length}</span> structured chunks for vector stores.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-panel active-press focus-ring transition-colors"
            aria-label="Close export modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Controls: Framework Tabs & Direct Dataset Download */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-panel px-4 pt-1.5 gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap active-press focus-ring',
                    isActive
                      ? 'border-primary text-primary-light bg-surface rounded-t-sm'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface/50'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-slate-500')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dataset Download Action Group */}
          {chunks.length > 0 && (
            <div className="flex items-center gap-1.5 pb-1.5">
              <button
                onClick={handleDownloadJson}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs bg-surface hover:bg-subtle text-slate-200 border border-border active-press focus-ring transition-colors shadow-subtle"
                title="Download chunked data as JSON with full metadata"
              >
                <FileJson className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-mono">JSON</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs bg-surface hover:bg-subtle text-slate-200 border border-border active-press focus-ring transition-colors shadow-subtle"
                title="Download chunked data as CSV spreadsheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono">CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Code Preview Box */}
        <div className="relative p-5 bg-canvas font-mono text-xs">
          <button
            onClick={handleCopy}
            className="absolute top-7 right-7 flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 active-press focus-ring transition-colors shadow-subtle"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="font-medium">Copy Code</span>
              </>
            )}
          </button>

          <pre className="text-slate-300 overflow-x-auto max-h-[380px] p-4 rounded-md bg-panel border border-border leading-relaxed selection:bg-primary/20">
            {code}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="font-mono text-slate-400">
            Target: <span className="text-slate-200">{config.strategy}</span> •{' '}
            <span className="tabular-nums text-slate-200">{config.chunkSize}</span> {config.unit} •{' '}
            <span className="tabular-nums text-slate-200">{config.chunkOverlap}</span> overlap
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-panel hover:bg-subtle text-slate-300 hover:text-white border border-border active-press focus-ring transition-colors text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
