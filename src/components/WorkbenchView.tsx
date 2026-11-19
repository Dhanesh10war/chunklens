import React, { useState, useMemo, useEffect, useDeferredValue, Suspense } from 'react';
import { ChunkingConfig, ChunkingStrategy } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { useChunkingWorker } from '../engine/worker/useChunkingWorker';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MetricsBar } from './MetricsBar';
import { EmptyState } from './EmptyState';
import { VisualCanvas } from './VisualCanvas';
import { ChunkInspector } from './ChunkInspector';
import { useToast } from './ui/Toast';
import { SegmentedControl } from './ui/SegmentedControl';
import { Layers, Grid3X3, Edit3 } from 'lucide-react';
import { loadStoredSession, saveStoredSession, clearStoredSession, DEFAULT_SESSION } from '../utils/storage';
import { DetectedFormatInfo, detectFileFormat } from '../utils/fileFormatDetector';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { ChunkLoadErrorBoundary } from './ui/ChunkLoadErrorBoundary';
import { ModalLoadingFallback } from './ui/ModalLoadingFallback';
import { generateShareableUrl, parseSharedConfigFromUrl } from '../utils/shareUrl';
import { copyToClipboard } from '../utils/clipboard';

// Lazy-load modals
const prefetchCommandPalette = () =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette }));
const prefetchComparisonView = () =>
  import('./ComparisonView').then((m) => ({ default: m.ComparisonView }));
const prefetchExportModal = () =>
  import('./ExportModal').then((m) => ({ default: m.ExportModal }));
const prefetchSimilarityHeatmap = () =>
  import('./SimilarityHeatmap').then((m) => ({ default: m.SimilarityHeatmap }));
const prefetchTokenizerModal = () =>
  import('./TokenizerComparisonModal').then((m) => ({ default: m.TokenizerComparisonModal }));

const CommandPalette = React.lazy(prefetchCommandPalette);
const ComparisonView = React.lazy(prefetchComparisonView);
const ExportModal = React.lazy(prefetchExportModal);
const SimilarityHeatmap = React.lazy(prefetchSimilarityHeatmap);
const TokenizerComparisonModal = React.lazy(prefetchTokenizerModal);

export interface WorkbenchViewProps {
  onOpenLanding: () => void;
  onOpenLearnTrack: (slug?: string | null) => void;
  initialSampleId?: string | null;
  initialConfig?: ChunkingConfig | null;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  onOpenLanding,
  onOpenLearnTrack,
  initialSampleId: propInitialSampleId,
  initialConfig: propInitialConfig,
}) => {
  // Load restored session or default sample
  const initialSession = useMemo(() => loadStoredSession(), []);

  const [rememberDocument, setRememberDocument] = useState<boolean>(
    Boolean(initialSession.rememberDocument)
  );
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(
    propInitialSampleId !== undefined ? propInitialSampleId : initialSession.selectedSampleId
  );
  const [documentTitle, setDocumentTitle] = useState<string>(initialSession.documentTitle);
  const [rawText, setRawText] = useState<string>(initialSession.rawText || '');
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormatInfo | null>(
    initialSession.detectedFormat || (initialSession.rawText ? detectFileFormat(initialSession.documentTitle, initialSession.rawText) : null)
  );

  // Chunking parameters
  const [config, setConfig] = useState<ChunkingConfig>(
    propInitialConfig || initialSession.config
  );

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(max-width: 1023px)').matches) {
        return false;
      }
    }
    return !initialSession.sidebarCollapsed;
  });
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isTokenizerModalOpen, setIsTokenizerModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'heatmap' | 'editor'>('visualizer');

  const { success } = useToast();

  // Idle prefetching for modal dialogs (Cmd+K and Export)
  useEffect(() => {
    const idlePrefetch = () => {
      prefetchCommandPalette();
      prefetchExportModal();
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (
        window as unknown as {
          requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number;
        }
      ).requestIdleCallback(idlePrefetch, { timeout: 3000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (
            window as unknown as { cancelIdleCallback: (id: number) => void }
          ).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(idlePrefetch, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save session changes to localStorage
  useEffect(() => {
    saveStoredSession({
      selectedSampleId,
      documentTitle,
      rawText,
      config,
      detectedFormat,
      rememberDocument,
      sidebarCollapsed: !isSidebarOpen,
    });
  }, [selectedSampleId, documentTitle, rawText, config, detectedFormat, rememberDocument, isSidebarOpen]);

  // Check URL on initial load for shareable configuration state
  useEffect(() => {
    const shared = parseSharedConfigFromUrl();
    if (shared) {
      if (Object.keys(shared.config).length > 0) {
        setConfig((prev) => ({
          ...prev,
          ...shared.config,
        }));
      }
      if (shared.sampleId) {
        handleSelectSample(shared.sampleId);
      }
      success(
        'Shared Setup Restored',
        `Configured ${shared.config.strategy || 'custom'} (${shared.config.chunkSize || 400} tok)`
      );
    }
  }, []);

  const handleShareSetup = async () => {
    const url = generateShareableUrl(config, selectedSampleId, documentTitle);
    const ok = await copyToClipboard(url);
    if (ok) {
      success('Shareable Link Copied', 'Link with your exact chunking setup copied to clipboard.');
    }
  };

  const handleSelectArchetype = (newConfig: ChunkingConfig, sampleId?: string) => {
    setConfig(newConfig);
    if (sampleId) {
      handleSelectSample(sampleId);
    }
    success('RAG Archetype Applied', `Configured ${newConfig.chunkSize} tokens with ${newConfig.chunkOverlap} overlap.`);
  };

  // Decouple high-frequency slider dragging from CPU tokenization for smooth 60fps UI
  const deferredText = useDeferredValue(rawText);
  const deferredConfig = useDeferredValue(config);

  // Background Web Worker offloads tokenization and chunk slicing from main UI thread
  const { result: chunkingResult, isProcessing, error: workerError } = useChunkingWorker(deferredText, deferredConfig);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
      } else if (e.key === '[') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (e.key === ']') {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onOpenLearnTrack();
      } else if (e.key === 'Escape') {
        if (selectedChunkId) {
          e.preventDefault();
          setSelectedChunkId(null);
        }
      } else if (activeTab === 'visualizer' && chunkingResult.chunks.length > 0) {
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedChunkId((prevId) => {
            if (!prevId) return chunkingResult.chunks[0].id;
            const currentIdx = chunkingResult.chunks.findIndex((c) => c.id === prevId);
            const nextIdx = Math.min(chunkingResult.chunks.length - 1, currentIdx + 1);
            return chunkingResult.chunks[nextIdx].id;
          });
        } else if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedChunkId((prevId) => {
            if (!prevId) return chunkingResult.chunks[chunkingResult.chunks.length - 1].id;
            const currentIdx = chunkingResult.chunks.findIndex((c) => c.id === prevId);
            const prevIndex = Math.max(0, currentIdx - 1);
            return chunkingResult.chunks[prevIndex].id;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, chunkingResult.chunks, selectedChunkId, onOpenLearnTrack]);

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
    setRawText(DEFAULT_SESSION.rawText || '');
    setConfig(DEFAULT_SESSION.config);
    setDetectedFormat(DEFAULT_SESSION.detectedFormat || null);
    setSelectedChunkId(null);
    clearError();
  };

  const handleClearSavedData = () => {
    clearStoredSession();
    setRememberDocument(false);
    setSelectedSampleId(DEFAULT_SESSION.selectedSampleId);
    setDocumentTitle(DEFAULT_SESSION.documentTitle);
    setRawText(DEFAULT_SESSION.rawText || '');
    setConfig(DEFAULT_SESSION.config);
    setDetectedFormat(DEFAULT_SESSION.detectedFormat || null);
    setSelectedChunkId(null);
    clearError();
    success('Saved data cleared from this browser');
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
      {/* 52px Unified Header */}
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
        onOpenLandingPage={onOpenLanding}
        onShareClick={handleShareSetup}
        onOpenLearningModal={() => onOpenLearnTrack()}
        onPrefetchExport={prefetchExportModal}
        onPrefetchCommandPalette={prefetchCommandPalette}
        onPrefetchTokenizer={prefetchTokenizerModal}
        onPrefetchLearningModal={() => {}}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onClearSavedData={handleClearSavedData}
      />

      {/* App Shell Layout: Collapsible Sidebar + Hero Main Canvas + Pro Inspector */}
      <div className="flex-1 flex overflow-hidden h-app-content">
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
          isExtractingPdf={isExtractingPdf}
          rememberDocument={rememberDocument}
          onToggleRememberDocument={setRememberDocument}
          onOpenTokenizerModal={() => setIsTokenizerModalOpen(true)}
          onPrefetchTokenizerModal={prefetchTokenizerModal}
        />

        {/* Hero Content Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-base overflow-hidden">
          {!rawText.trim() ? (
            <EmptyState
              onSelectSample={handleSelectSample}
              onFileUpload={handleFileUploadProcess}
              onPasteText={(text, title) => {
                const formatInfo = detectFileFormat(title || 'Pasted Snippet', text);
                handleFileUpload(text, title || 'Pasted Snippet', formatInfo);
              }}
              uploadError={uploadError}
              onDismissError={clearError}
              isExtractingPdf={isExtractingPdf}
              onSelectArchetype={handleSelectArchetype}
              activeConfig={config}
            />
          ) : (
            <>
              {/* Worker Error Banner */}
              {workerError && (
                <div
                  role="alert"
                  className="px-4 py-2 bg-status-danger/10 border-b border-status-danger/30 text-status-danger text-xs flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    <strong>Chunking Error:</strong> {workerError}
                  </span>
                </div>
              )}

              {/* Slim Summary Strip */}
              <MetricsBar
                result={chunkingResult}
                isProcessing={isProcessing}
              />

              {/* Canvas Subnavigation Bar (Mobile only, desktop uses toolbar segmented control) */}
              <div className="px-4 sm:px-6 py-2 border-b border-separator bg-surface-1/30 flex md:hidden items-center justify-between">
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
                  <ChunkLoadErrorBoundary fallbackTitle="Failed to load Similarity Heatmap">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-text-tertiary">Loading heatmap...</div>}>
                      <SimilarityHeatmap chunks={chunkingResult.chunks} />
                    </Suspense>
                  </ChunkLoadErrorBoundary>
                ) : isCompareMode ? (
                  <ChunkLoadErrorBoundary fallbackTitle="Failed to load Comparison View">
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
                  </ChunkLoadErrorBoundary>
                ) : (
                  <VisualCanvas
                    chunks={chunkingResult.chunks}
                    selectedChunkId={selectedChunkId}
                    onSelectChunk={(chunkId) => {
                      setSelectedChunkId(chunkId);
                      if (chunkId) setIsInspectorOpen(true);
                    }}
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

                {/* Right Inspector Drawer */}
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
            </>
          )}
        </main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <ChunkLoadErrorBoundary fallbackTitle="Failed to load Command Palette">
        <Suspense fallback={isCommandPaletteOpen ? <ModalLoadingFallback label="Loading command palette..." /> : null}>
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
              onOpenLearningModal={() => onOpenLearnTrack()}
              onSelectTab={setActiveTab}
              onToggleCompare={() => setIsCompareMode(!isCompareMode)}
              onClearSavedData={handleClearSavedData}
            />
          )}
        </Suspense>
      </ChunkLoadErrorBoundary>

      {/* Code & Data Export Modal */}
      <ChunkLoadErrorBoundary fallbackTitle="Failed to load Export options">
        <Suspense fallback={isExportModalOpen ? <ModalLoadingFallback label="Loading export options..." /> : null}>
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
      </ChunkLoadErrorBoundary>

      {/* Tokenizer Comparison & Cost Analyzer Modal */}
      <ChunkLoadErrorBoundary fallbackTitle="Failed to load Tokenizer comparison">
        <Suspense fallback={isTokenizerModalOpen ? <ModalLoadingFallback label="Loading tokenizer comparison..." /> : null}>
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
      </ChunkLoadErrorBoundary>
    </div>
  );
};
