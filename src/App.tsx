import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { ChunkingConfig } from './engine/types';
import { SAMPLE_DOCUMENTS } from './data/samples';
import { executeChunking } from './engine/chunkers';
import { Header } from './components/Header';
import { ControlsPanel } from './components/ControlsPanel';
import { MetricsBar } from './components/MetricsBar';
import { VisualCanvas } from './components/VisualCanvas';
import { ComparisonView } from './components/ComparisonView';
import { ExportModal } from './components/ExportModal';
import { SimilarityHeatmap } from './components/SimilarityHeatmap';
import { Edit3, Eye, FileText, RotateCcw, Grid3X3 } from 'lucide-react';
import { cn } from './utils/cn';
import { loadStoredSession, saveStoredSession, clearStoredSession, DEFAULT_SESSION } from './utils/storage';

export const App: React.FC = () => {
  // Load restored session or default sample
  const initialSession = useMemo(() => loadStoredSession(), []);

  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(initialSession.selectedSampleId);
  const [documentTitle, setDocumentTitle] = useState<string>(initialSession.documentTitle);
  const [rawText, setRawText] = useState<string>(initialSession.rawText);

  // Chunking parameters
  const [config, setConfig] = useState<ChunkingConfig>(initialSession.config);

  // UI state
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'heatmap' | 'editor'>('visualizer');

  // Persist session changes to localStorage
  useEffect(() => {
    saveStoredSession({
      selectedSampleId,
      documentTitle,
      rawText,
      config,
    });
  }, [selectedSampleId, documentTitle, rawText, config]);

  // Decouple high-frequency slider dragging from CPU tokenization for smooth 60fps UI
  const deferredText = useDeferredValue(rawText);
  const deferredConfig = useDeferredValue(config);

  // Reactive chunking execution using deferred inputs
  const chunkingResult = useMemo(() => {
    return executeChunking(deferredText, deferredConfig);
  }, [deferredText, deferredConfig]);

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

  const handleResetToDefaults = () => {
    clearStoredSession();
    setSelectedSampleId(DEFAULT_SESSION.selectedSampleId);
    setDocumentTitle(DEFAULT_SESSION.documentTitle);
    setRawText(DEFAULT_SESSION.rawText);
    setConfig(DEFAULT_SESSION.config);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-100 font-sans">
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
        <div className="px-6 py-2 border-b border-border bg-panel flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-primary-400" />
            <span className="font-medium text-slate-400">Document:</span>
            <span className="text-white font-semibold font-mono">{documentTitle}</span>
            <button
              onClick={handleResetToDefaults}
              className="ml-2 h-6 flex items-center space-x-1.5 text-[11px] text-slate-400 hover:text-slate-200 px-2 rounded bg-surface border border-border hover:border-border-hover active-press focus-ring transition-colors"
              title="Reset document and chunking settings to defaults"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-canvas p-0.5 rounded border border-border">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={cn(
                'h-7 flex items-center space-x-1.5 px-3 rounded text-xs active-press focus-ring transition-colors',
                activeTab === 'visualizer'
                  ? 'bg-primary-600 text-white font-medium shadow-subtle'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Chunks</span>
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={cn(
                'h-7 flex items-center space-x-1.5 px-3 rounded text-xs active-press focus-ring transition-colors',
                activeTab === 'heatmap'
                  ? 'bg-primary-600 text-white font-medium shadow-subtle'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              <span>Similarity Heatmap</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                'h-7 flex items-center space-x-1.5 px-3 rounded text-xs active-press focus-ring transition-colors',
                activeTab === 'editor'
                  ? 'bg-primary-600 text-white font-medium shadow-subtle'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Raw Text</span>
            </button>
          </div>
        </div>

        {/* Content View: Editor, Heatmap, or Visualizer / Comparison */}
        {activeTab === 'editor' ? (
          <div className="flex-1 p-6 bg-canvas flex flex-col">
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setSelectedSampleId(null);
              }}
              placeholder="Paste or type raw document text here to test chunking in real time..."
              className="flex-1 w-full bg-surface border border-border rounded-lg p-4 font-mono text-xs text-slate-200 focus-ring hover:border-border-hover resize-none leading-relaxed shadow-subtle"
            />
          </div>
        ) : activeTab === 'heatmap' ? (
          <SimilarityHeatmap chunks={chunkingResult.chunks} />
        ) : isCompareMode ? (
          <ComparisonView
            primaryConfig={config}
            rawText={rawText}
            onApplyVariantB={(newConfig) => {
              setConfig(newConfig);
              setIsCompareMode(false);
            }}
          />
        ) : (
          <VisualCanvas chunks={chunkingResult.chunks} />
        )}
      </main>

      {/* Export Code & Dataset Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        chunks={chunkingResult.chunks}
        docTitle={documentTitle}
      />
    </div>
  );
};
