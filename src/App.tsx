import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { ChunkingConfig } from './engine/types';
import { SAMPLE_DOCUMENTS } from './data/samples';
import { useChunkingWorker } from './engine/worker/useChunkingWorker';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MetricsBar } from './components/MetricsBar';
import { VisualCanvas } from './components/VisualCanvas';
import { ComparisonView } from './components/ComparisonView';
import { ExportModal } from './components/ExportModal';
import { SimilarityHeatmap } from './components/SimilarityHeatmap';
import { TokenizerComparisonModal } from './components/TokenizerComparisonModal';
import { ToastProvider } from './components/ui/Toast';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { Layers, Grid3X3, Edit3 } from 'lucide-react';
import { loadStoredSession, saveStoredSession, clearStoredSession, DEFAULT_SESSION } from './utils/storage';

export const AppContent: React.FC = () => {
  // Load restored session or default sample
  const initialSession = useMemo(() => loadStoredSession(), []);

  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(initialSession.selectedSampleId);
  const [documentTitle, setDocumentTitle] = useState<string>(initialSession.documentTitle);
  const [rawText, setRawText] = useState<string>(initialSession.rawText);

  // Chunking parameters
  const [config, setConfig] = useState<ChunkingConfig>(initialSession.config);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isTokenizerModalOpen, setIsTokenizerModalOpen] = useState<boolean>(false);
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

  // Global keyboard shortcuts: '[' toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '[') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Decouple high-frequency slider dragging from CPU tokenization for smooth 60fps UI
  const deferredText = useDeferredValue(rawText);
  const deferredConfig = useDeferredValue(config);

  // Background Web Worker offloads tokenization and chunk slicing from main UI thread
  const { result: chunkingResult, isProcessing } = useChunkingWorker(deferredText, deferredConfig);

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
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary font-sans antialiased">
      {/* 48px Header */}
      <Header
        documentTitle={documentTitle}
        onResetDocument={handleResetToDefaults}
        onExportClick={() => setIsExportModalOpen(true)}
        onTokenizerClick={() => setIsTokenizerModalOpen(true)}
        isCompareMode={isCompareMode}
        onToggleCompare={() => setIsCompareMode(!isCompareMode)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* App Shell Layout: Collapsible Sidebar + Hero Main Canvas */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-48px)]">
        {/* Left Sidebar */}
        <Sidebar
          config={config}
          onChangeConfig={setConfig}
          selectedSampleId={selectedSampleId}
          onSelectSample={handleSelectSample}
          onFileUpload={handleFileUpload}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Hero Content Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-base overflow-hidden">
          {/* Slim Summary Strip */}
          <MetricsBar
            result={chunkingResult}
            isProcessing={isProcessing}
            onOpenTokenizerModal={() => setIsTokenizerModalOpen(true)}
          />

          {/* Canvas Subnavigation Bar */}
          <div className="px-4 sm:px-6 py-2 border-b border-border-default bg-surface/30 flex items-center justify-between">
            <SegmentedControl
              variant="underline"
              options={[
                { value: 'visualizer', label: 'Chunks', icon: <Layers className="h-3.5 w-3.5" /> },
                { value: 'heatmap', label: 'Similarity Heatmap', icon: <Grid3X3 className="h-3.5 w-3.5" /> },
                { value: 'editor', label: 'Edit Raw Text', icon: <Edit3 className="h-3.5 w-3.5" /> },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as 'visualizer' | 'heatmap' | 'editor')}
            />
          </div>

          {/* Main View Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'editor' ? (
              <div className="flex-1 p-6 flex flex-col bg-bg-base">
                <div className="flex items-center justify-between pb-2 text-xs">
                  <span className="font-medium text-text-secondary">Raw Document Source</span>
                  <span className="font-mono text-text-tertiary tabular-nums">
                    {rawText.length.toLocaleString()} characters
                  </span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste or write document text to chunk..."
                  className="flex-1 w-full bg-surface border border-border-default rounded-md p-4 font-mono text-xs text-text-primary leading-relaxed resize-none focus-ring transition-colors"
                  spellCheck="false"
                  aria-label="Raw document editor"
                />
              </div>
            ) : activeTab === 'heatmap' ? (
              <SimilarityHeatmap chunks={chunkingResult.chunks} />
            ) : isCompareMode ? (
              <ComparisonView
                rawText={deferredText}
                primaryConfig={config}
                onApplyVariantB={(newConfig) => {
                  setConfig(newConfig);
                  setIsCompareMode(false);
                }}
              />
            ) : (
              <VisualCanvas chunks={chunkingResult.chunks} />
            )}
          </div>
        </main>
      </div>

      {/* Export Code & Dataset Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        chunks={chunkingResult.chunks}
        docTitle={documentTitle}
      />

      {/* Multi-Model Tokenizer Comparison Matrix Modal */}
      <TokenizerComparisonModal
        isOpen={isTokenizerModalOpen}
        onClose={() => setIsTokenizerModalOpen(false)}
        rawText={deferredText}
        chunks={chunkingResult.chunks}
        baselineEncoding={config.encoding}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
