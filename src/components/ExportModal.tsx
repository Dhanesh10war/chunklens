import React, { useState } from 'react';
import { ChunkMetadata, ChunkingConfig, CodeExportFramework } from '../engine/types';
import { generateExportCode } from '../exporters/codeExporters';
import { exportChunksToJson, exportChunksToCsv, downloadFile } from '../exporters/dataExporters';
import { copyToClipboard } from '../utils/clipboard';
import { X, Copy, Check, Terminal, FileJson, FileSpreadsheet } from 'lucide-react';
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

  const tabs: { id: CodeExportFramework; label: string; icon: string }[] = [
    { id: 'langchain-python', label: 'LangChain (Python)', icon: '🐍' },
    { id: 'llamaindex-python', label: 'LlamaIndex (Python)', icon: '🦙' },
    { id: 'langchain-js', label: 'LangChain.js (TS)', icon: '⚡' },
    { id: 'native-python', label: 'Native Python (0 Deps)', icon: '📦' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090d16]/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Export Code & Chunk Dataset</h3>
              <p className="text-xs text-slate-400">
                Copy ingestion pipeline code or download the generated chunks ({chunks.length} chunks ready for vector DB).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Controls: Framework Tabs & Direct Dataset Download */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#0b101d] px-4 pt-2 gap-2">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-300 bg-primary-500/10 rounded-t'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Dataset Download Action Group */}
          {chunks.length > 0 && (
            <div className="flex items-center gap-1.5 pb-2">
              <button
                onClick={handleDownloadJson}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs bg-surface-elevated hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Download chunked data as JSON with full metadata"
              >
                <FileJson className="h-3.5 w-3.5 text-accent-cyan" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs bg-surface-elevated hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Download chunked data as CSV spreadsheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-accent-emerald" />
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Code Preview Box */}
        <div className="relative p-6 bg-[#090d16] font-mono text-xs">
          <button
            onClick={handleCopy}
            className="absolute top-8 right-8 flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-primary-500/20 border border-primary-500/40 text-primary-300 hover:bg-primary-500/30 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <pre className="text-slate-300 overflow-x-auto max-h-[380px] p-4 rounded-lg bg-[#0b101d] border border-slate-800/80 leading-relaxed">
            {code}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#090d16] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>Configured for: {config.strategy} • {config.chunkSize} {config.unit} • {config.chunkOverlap} overlap</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-surface-elevated text-slate-300 hover:text-white border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
