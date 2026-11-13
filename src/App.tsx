import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import { ChunkingConfig, ChunkingStrategy } from './engine/types';
import { SAMPLE_DOCUMENTS } from './data/samples';
import { useChunkingWorker } from './engine/worker/useChunkingWorker';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MetricsBar } from './components/MetricsBar';
import { VisualCanvas } from './components/VisualCanvas';
import { ChunkInspector } from './components/ChunkInspector';
import { ToastProvider, useToast } from './components/ui/Toast';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { Layers, Grid3X3, Edit3 } from 'lucide-react';
import { loadStoredSession, saveStoredSession, clearStoredSession, DEFAULT_SESSION } from './utils/storage';
import { DetectedFormatInfo, detectFileFormat } from './utils/fileFormatDetector';
import { useDocumentUpload } from './hooks/useDocumentUpload';

// Lazy-load heavy modals and auxiliary views to keep main bundle well below budget
const CommandPalette = React.lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
const ComparisonView = React.lazy(() =>
  import('./components/ComparisonView').then((m) => ({ default: m.ComparisonView }))
);
const ExportModal = React.lazy(() =>
  import('./components/ExportModal').then((m) => ({ default: m.ExportModal }))
);
const SimilarityHeatmap = React.lazy(() =>
  import('./components/SimilarityHeatmap').then((m) => ({ default: m.SimilarityHeatmap }))
);
const TokenizerComparisonModal = React.lazy(() =>
  import('./components/TokenizerComparisonModal').then((m) => ({ default: m.TokenizerComparisonModal }))
);

export const AppContent: React.FC = () => {
  // Load restored session or default sample
  const initialSession = useMemo(() => loadStoredSession(), []);

  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(initialSession.selectedSampleId);
  const [documentTitle, setDocumentTitle] = useState<string>(initialSession.documentTitle);
  const [rawText, setRawText] = useState<string>(initialSession.rawText);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormatInfo | null>(
    initialSession.detectedFormat || (initialSession.rawText ? detectFileFormat(initialSession.documentTitle, initialSession.rawText) : null)
  );

  // Chunking parameters
  const [config, setConfig] = useState<ChunkingConfig>(initialSession.config);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isTokenizerModalOpen, setIsTokenizerModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'heatmap' | 'editor'>('visualizer');
  const { success } = useToast();

  // Save session changes to localStorage
  useEffect(() => {
    saveStoredSession({
      selectedSampleId,
      documentTitle,
      rawText,
      config,
      detectedFormat,
    });
  }, [selectedSampleId, documentTitle, rawText, config, detectedFormat]);

  // Global keyboard shortcuts: '[' toggles sidebar, ']' toggles inspector, Cmd+K opens palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '[') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === ']') {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
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
      setSelectedChunkId(null);
      const fmt = detectFileFormat(sample.title, sample.content);
      setDetectedFormat(fmt);
    }
  };

  const handleFileUpload = (content: string, filename: string, formatInfo?: DetectedFormatInfo) => {
    const detected = formatInfo || detectFileFormat(filename, content);
    setSelectedSampleId(null);
    setDocumentTitle(filename);
    setRawText(content);
    setDetectedFormat(detected);
    setSelectedChunkId(null);

    // Auto-align optimal chunking strategy if different from current
    if (detected.recommendedStrategy !== config.strategy) {
      const updatedConfig: ChunkingConfig = {
        ...config,
        strategy: detected.recommendedStrategy,
      };
      if (detected.suggestedSeparators) {
        updatedConfig.separators = detected.suggestedSeparators;
      }
      setConfig(updatedConfig);
      success(
        `Auto-Selected ${detected.recommendedStrategy.toUpperCase()} Strategy`,
        `Optimized for ${detected.label} (${detected.badge})`
      );
    }
  };

  // Shared Document Upload Hook (for Sidebar and Empty-State dropzone)
  const {
    uploadError,
    clearError,
    isExtractingPdf,
    processFile: handleFileUploadProcess,
  } = useDocumentUpload({
    onSuccess: (content, filename, formatInfo) => {
      handleFileUpload(content, filename, formatInfo);
    },
    currentDocumentTitle: documentTitle,
  });

  const handleResetToDefaults = () => {
    clearStoredSession();
    setSelectedSampleId(DEFAULT_SESSION.selectedSampleId);
    setDocumentTitle(DEFAULT_SESSION.documentTitle);
    setRawText(DEFAULT_SESSION.rawText);
    setConfig(DEFAULT_SESSION.config);
    setDetectedFormat(DEFAULT_SESSION.detectedFormat || null);
    setSelectedChunkId(null);
    clearError();
  };

  const handleNewDocument = () => {
    setSelectedSampleId(null);
    setDocumentTitle('');
    setRawText('');
    setDetectedFormat(null);
    setSelectedChunkId(null);
    clearError();
  };

  // Find inspected chunk and immediate neighbors
  const selectedChunk = chunkingResult.chunks.find((c) => c.id === selectedChunkId) || null;
  const selectedChunkIdx = selectedChunk ? selectedChunk.index : -1;
  const prevChunk = selectedChunkIdx > 0 ? chunkingResult.chunks[selectedChunkIdx - 1] : null;
  const nextChunk =
    selectedChunkIdx >= 0 && selectedChunkIdx < chunkingResult.chunks.length - 1
      ? chunkingResult.chunks[selectedChunkIdx + 1]
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary font-sans antialiased">
      {/* 48px Header */}
      <Header
        documentTitle={documentTitle}
        detectedFormat={detectedFormat}
        onResetDocument={handleResetToDefaults}
        onExportClick={() => setIsExportModalOpen(true)}
        onTokenizerClick={() => setIsTokenizerModalOpen(true)}
        isCompareMode={isCompareMode}
        onToggleCompare={() => setIsCompareMode(!isCompareMode)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* App Shell Layout: Collapsible Sidebar + Hero Main Canvas + Pro Inspector */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-48px)]">
        {/* Left Sidebar */}
        <Sidebar
          config={config}
          onChangeConfig={setConfig}
          selectedSampleId={selectedSampleId}
          onSelectSample={handleSelectSample}
          onFileUpload={handleFileUploadProcess}
          onNewDocument={handleNewDocument}
          currentDocumentTitle={documentTitle}
          detectedFormat={detectedFormat}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          uploadError={uploadError}
          onDismissError={clearError}
          isExtractingPdf={isExtractingPdf}
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
          <div className="flex-1 overflow-hidden flex">
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
              <Suspense fallback={<div className="p-8 text-center text-xs text-text-tertiary">Loading heatmap...</div>}>
                <SimilarityHeatmap chunks={chunkingResult.chunks} />
              </Suspense>
            ) : isCompareMode ? (
              <Suspense fallback={<div className="p-8 text-center text-xs text-text-tertiary">Loading comparison...</div>}>
                <ComparisonView
                  rawText={deferredText}
                  primaryConfig={config}
                  onApplyVariantB={(newConfig) => {
                    setConfig(newConfig);
                    setIsCompareMode(false);
                  }}
                />
              </Suspense>
            ) : (
              <VisualCanvas
                chunks={chunkingResult.chunks}
                selectedChunkId={selectedChunkId}
                onSelectChunk={(chunkId) => {
                  setSelectedChunkId(chunkId);
                  if (chunkId) setIsInspectorOpen(true);
                }}
                detectedFormat={detectedFormat}
                onDropFile={handleFileUploadProcess}
                onSelectSample={handleSelectSample}
                onPasteText={(text, title) => {
                  const formatInfo = detectFileFormat(title || 'Pasted Snippet', text);
                  handleFileUpload(text, title || 'Pasted Snippet', formatInfo);
                }}
                uploadError={uploadError}
                onDismissError={clearError}
                isExtractingPdf={isExtractingPdf}
              />
            )}

            {/* Right Inspector Drawer (Collapsible, appears on chunk selection) */}
            {activeTab === 'visualizer' && !isCompareMode && selectedChunk && isInspectorOpen && (
              <ChunkInspector
                chunk={selectedChunk}
                totalChunks={chunkingResult.chunks.length}
                prevChunk={prevChunk}
                nextChunk={nextChunk}
                detectedFormat={detectedFormat}
                onSelectPrev={() => {
                  if (selectedChunkIdx > 0) {
                    setSelectedChunkId(chunkingResult.chunks[selectedChunkIdx - 1].id);
                  }
                }}
                onSelectNext={() => {
                  if (selectedChunkIdx < chunkingResult.chunks.length - 1) {
                    setSelectedChunkId(chunkingResult.chunks[selectedChunkIdx + 1].id);
                  }
                }}
                onClose={() => setIsInspectorOpen(false)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <Suspense fallback={null}>
        {isCommandPaletteOpen && (
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectStrategy={(strategy: ChunkingStrategy) => setConfig({ ...config, strategy })}
            currentStrategy={config.strategy}
            onSelectSample={handleSelectSample}
            onNewDocument={handleNewDocument}
            onResetDocument={handleResetToDefaults}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            onToggleInspector={() => {
              if (!isInspectorOpen && !selectedChunkId && chunkingResult.chunks.length > 0) {
                setSelectedChunkId(chunkingResult.chunks[0].id);
              }
              setIsInspectorOpen((prev) => !prev);
            }}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenTokenizer={() => setIsTokenizerModalOpen(true)}
            onSelectTab={setActiveTab}
            onToggleCompare={() => setIsCompareMode(!isCompareMode)}
          />
        )}
      </Suspense>

      {/* Code & Data Export Modal */}
      <Suspense fallback={null}>
        {isExportModalOpen && (
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            config={config}
            chunks={chunkingResult.chunks}
            docTitle={documentTitle}
          />
        )}
      </Suspense>

      {/* Tokenizer Comparison & Cost Analyzer Modal */}
      <Suspense fallback={null}>
        {isTokenizerModalOpen && (
          <TokenizerComparisonModal
            isOpen={isTokenizerModalOpen}
            onClose={() => setIsTokenizerModalOpen(false)}
            rawText={rawText}
            chunks={chunkingResult.chunks}
            baselineEncoding={config.encoding}
          />
        )}
      </Suspense>
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
