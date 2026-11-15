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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-surface-1 mac-translucent border border-separator rounded-panel w-full max-w-3xl overflow-hidden shadow-modal">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-separator bg-surface-1/50 mac-translucent">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-control bg-surface-2 border border-separator text-accent">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-text text-sm tracking-tight">Export Pipeline Code &amp; Datasets</h3>
              <p className="text-xs text-text-secondary">
                Production-ready code snippets or export <span className="font-mono text-text tabular-nums">{chunks.length}</span> structured chunks for vector stores.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-control text-text-secondary hover:text-text hover:bg-surface-2 active-press focus-ring transition-colors"
            aria-label="Close export modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Controls: Framework Tabs & Direct Dataset Download */}
        <div className="flex flex-wrap items-center justify-between border-b border-separator bg-surface-2/30 px-4 pt-1.5 gap-2">
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
                      ? 'border-accent text-accent bg-surface-1 rounded-t-control'
                      : 'border-transparent text-text-secondary hover:text-text hover:bg-surface-2/50'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-accent' : 'text-text-tertiary')} />
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
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-control text-xs bg-surface-2 hover:bg-surface-3 text-text border border-separator active-press focus-ring transition-colors shadow-subtle"
                title="Download chunked data as JSON with full metadata"
              >
                <FileJson className="h-3.5 w-3.5 text-accent" />
                <span className="font-mono">JSON</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-control text-xs bg-surface-2 hover:bg-surface-3 text-text border border-separator active-press focus-ring transition-colors shadow-subtle"
                title="Download chunked data as CSV spreadsheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-status-success" />
                <span className="font-mono">CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Code Preview Box */}
        <div className="relative p-5 bg-bg font-mono text-xs">
          <button
            onClick={handleCopy}
            className="absolute top-7 right-7 flex items-center space-x-1.5 px-3 py-1.5 rounded-control bg-accent text-white hover:bg-accent-hover active-press focus-ring transition-colors shadow-subtle font-sans text-xs font-medium"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <pre className="text-text overflow-x-auto max-h-[380px] p-4 rounded-card bg-surface-1 border border-separator leading-relaxed selection:bg-accent/20">
            {code}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-separator bg-surface-1/50 mac-translucent flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
          <span className="font-mono text-text-secondary">
            Target: <span className="text-text font-medium">{config.strategy}</span> •{' '}
            <span className="tabular-nums text-text font-medium">{config.chunkSize}</span> {config.unit} •{' '}
            <span className="tabular-nums text-text font-medium">{config.chunkOverlap}</span> overlap
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-control bg-surface-2 hover:bg-surface-3 text-text border border-separator active-press focus-ring transition-colors text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
