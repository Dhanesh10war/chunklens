import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { ChunkingConfig, ChunkingStrategy } from './engine/types';
import { SAMPLE_DOCUMENTS } from './data/samples';
import { useChunkingWorker } from './engine/worker/useChunkingWorker';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MetricsBar } from './components/MetricsBar';
import { VisualCanvas } from './components/VisualCanvas';
import { ChunkInspector } from './components/ChunkInspector';
import { CommandPalette } from './components/CommandPalette';
import { ComparisonView } from './components/ComparisonView';
import { ExportModal } from './components/ExportModal';
import { SimilarityHeatmap } from './components/SimilarityHeatmap';
import { TokenizerComparisonModal } from './components/TokenizerComparisonModal';
import { ToastProvider } from './components/ui/Toast';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { Layers, Grid3X3, Edit3 } from 'lucide-react';
import { loadStoredSession, saveStoredSession, clearStoredSession, DEFAULT_SESSION } from './utils/storage';
import { DetectedFormatInfo, detectFileFormat, isPdfBuffer } from './utils/fileFormatDetector';
import { useToast } from './components/ui/Toast';

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

  // Persist session changes to localStorage
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

  const handleDropFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || isPdfBuffer(buffer);
      if (isPdf) {
        const { extractTextFromPdf } = await import('./utils/pdfParser');
        const result = await extractTextFromPdf(buffer);
        if (result.text.trim()) {
          const formatInfo = detectFileFormat(file.name, result.text, buffer);
          handleFileUpload(result.text, file.name, formatInfo);
        }
      } else {
        const content = new TextDecoder('utf-8').decode(buffer);
        if (content.trim()) {
          const formatInfo = detectFileFormat(file.name, content);
          handleFileUpload(content, file.name, formatInfo);
        }
      }
    } catch (err) {
      console.error('Failed to process dropped file:', err);
    }
  };

  const handleResetToDefaults = () => {
    clearStoredSession();
    setSelectedSampleId(DEFAULT_SESSION.selectedSampleId);
    setDocumentTitle(DEFAULT_SESSION.documentTitle);
    setRawText(DEFAULT_SESSION.rawText);
    setConfig(DEFAULT_SESSION.config);
    setDetectedFormat(DEFAULT_SESSION.detectedFormat || null);
    setSelectedChunkId(null);
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
          onFileUpload={handleFileUpload}
          detectedFormat={detectedFormat}
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
              <VisualCanvas
                chunks={chunkingResult.chunks}
                selectedChunkId={selectedChunkId}
                onSelectChunk={(chunkId) => {
                  setSelectedChunkId(chunkId);
                  if (chunkId) setIsInspectorOpen(true);
                }}
                detectedFormat={detectedFormat}
                onDropFile={handleDropFile}
                onLoadDefaultSample={() => handleSelectSample('attention-paper')}
                onUploadClick={() => setIsSidebarOpen(true)}
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
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectStrategy={(strategy: ChunkingStrategy) => setConfig({ ...config, strategy })}
        currentStrategy={config.strategy}
        onSelectSample={handleSelectSample}
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
        onSelectTab={(tab) => setActiveTab(tab)}
        onToggleCompare={() => setIsCompareMode((prev) => !prev)}
      />

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
