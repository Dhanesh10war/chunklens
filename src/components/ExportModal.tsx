import React, { useState } from 'react';
import { ChunkingConfig, CodeExportFramework } from '../engine/types';
import { generateExportCode } from '../exporters/codeExporters';
import { X, Copy, Check, Terminal } from 'lucide-react';
import { cn } from '../utils/cn';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChunkingConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, config }) => {
  const [activeTab, setActiveTab] = useState<CodeExportFramework>('langchain-python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = generateExportCode(config, activeTab);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <h3 className="font-semibold text-white text-sm">Export Production Chunking Code</h3>
              <p className="text-xs text-slate-400">
                Copy and run directly in your RAG ingestion pipeline.
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

        {/* Framework Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0b101d] px-4 pt-2 gap-2 overflow-x-auto">
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
        <div className="px-6 py-3 border-t border-slate-800 bg-[#090d16] flex items-center justify-between text-xs text-slate-400">
          <span>Configured for: {config.strategy} • {config.chunkSize} {config.unit} • {config.chunkOverlap} overlap</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-surface-elevated text-slate-300 hover:text-white border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
