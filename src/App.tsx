import React, { useState, useMemo } from 'react';
import { ChunkingConfig } from './engine/types';
import { SAMPLE_DOCUMENTS } from './data/samples';
import { executeChunking } from './engine/chunkers';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { MetricsBar } from './components/MetricsBar';
import { VisualCanvas } from './components/VisualCanvas';
import { ComparisonView } from './components/ComparisonView';
import { ExportModal } from './components/ExportModal';
import { Edit3, Eye, FileText } from 'lucide-react';
import { cn } from './utils/cn';

export const App: React.FC = () => {
  // Active sample or custom document text
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>('api-reference');
  const [documentTitle, setDocumentTitle] = useState<string>(SAMPLE_DOCUMENTS[0].title);
  const [rawText, setRawText] = useState<string>(SAMPLE_DOCUMENTS[0].content);

  // Chunking parameters
  const [config, setConfig] = useState<ChunkingConfig>({
    strategy: 'recursive',
    chunkSize: 400,
    chunkOverlap: 40,
    unit: 'tokens',
    encoding: 'o200k_base',
  });

  // UI state
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'editor'>('visualizer');

  // Reactive chunking execution (debounced automatically via React rendering)
  const chunkingResult = useMemo(() => {
    return executeChunking(rawText, config);
  }, [rawText, config]);

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (sample) {
      setSelectedSampleId(sample.id);
      setDocumentTitle(sample.title);
      setRawText(sample.content);
    }
  };

  const handleFileUpload = (content: string, filename: string) => {
    setSelectedSampleId(null);
    setDocumentTitle(filename);
    setRawText(content);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans">
      {/* Top Header */}
      <Header
        onExportClick={() => setIsExportModalOpen(true)}
        isCompareMode={isCompareMode}
        onToggleCompare={() => setIsCompareMode(!isCompareMode)}
      />

      {/* Reactive Control Toolbar */}
      <ControlsPanel
        config={config}
        onChangeConfig={setConfig}
        selectedSampleId={selectedSampleId}
        onSelectSample={handleSelectSample}
        onFileUpload={handleFileUpload}
      />

      {/* Real-Time Metrics Bar */}
      <MetricsBar result={chunkingResult} />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Document Header & Tab Navigation */}
        <div className="px-6 py-2 border-b border-slate-800 bg-[#0b101d] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-primary-400" />
            <span className="font-medium text-slate-300">Document:</span>
            <span className="text-white font-semibold font-mono">{documentTitle}</span>
          </div>

          <div className="flex items-center space-x-1 bg-surface-elevated p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={cn(
                'flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors',
                activeTab === 'visualizer'
                  ? 'bg-primary-500 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Chunks</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                'flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors',
                activeTab === 'editor'
                  ? 'bg-primary-500 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Raw Text</span>
            </button>
          </div>
        </div>

        {/* Content View: Editor or Visualizer / Comparison */}
        {activeTab === 'editor' ? (
          <div className="flex-1 p-6 bg-[#090d16] flex flex-col">
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setSelectedSampleId(null);
              }}
              placeholder="Paste or type raw document text here to test chunking in real time..."
              className="flex-1 w-full bg-surface border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-primary-500 resize-none leading-relaxed"
            />
          </div>
        ) : isCompareMode ? (
          <ComparisonView primaryConfig={config} rawText={rawText} />
        ) : (
          <VisualCanvas chunks={chunkingResult.chunks} />
        )}
      </main>

      {/* Export Code Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
      />
    </div>
  );
};
