import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WidgetContainer } from './WidgetContainer';
import { chunkFixed } from '../../../engine/chunkers/fixedChunker';
import { chunkRecursive } from '../../../engine/chunkers/recursiveChunker';
import { chunkMarkdown } from '../../../engine/chunkers/markdownChunker';
import { chunkSentence } from '../../../engine/chunkers/sentenceChunker';
import { chunkTabular } from '../../../engine/chunkers/tabularChunker';
import { setChunkerTokenizerContext } from '../../../engine/chunkers/context';
import { ChunkingConfig, ChunkingStrategy, ChunkMetadata, ChunkUnit } from '../../../engine/types';
import { SAMPLE_DOCUMENTS } from '../../../data/samples';
import { generateShareableUrl } from '../../../utils/shareUrl';

const MAX_INPUT_CHARS = 50000;

interface V2ChunkSandboxProps {
  initialStrategy?: ChunkingStrategy;
  initialChunkSize?: string | number;
  initialChunkOverlap?: string | number;
  initialSampleId?: string;
  onLaunchWorkbench?: (shareParams?: string) => void;
}

export const V2ChunkSandbox: React.FC<V2ChunkSandboxProps> = ({
  initialStrategy = 'recursive',
  initialChunkSize = 400,
  initialChunkOverlap = 40,
  initialSampleId = 'api-reference',
  onLaunchWorkbench,
}) => {
  const defaultSample =
    SAMPLE_DOCUMENTS.find((s) => s.id === initialSampleId) || SAMPLE_DOCUMENTS[0];

  const [strategy, setStrategy] = useState<ChunkingStrategy>(initialStrategy);
  const [chunkSize, setChunkSize] = useState<number>(Number(initialChunkSize) || 400);
  const [chunkOverlap, setChunkOverlap] = useState<number>(Number(initialChunkOverlap) || 40);
  const [unit, setUnit] = useState<ChunkUnit>('characters');
  const [text, setText] = useState<string>(defaultSample.content);
  const [debouncedText, setDebouncedText] = useState<string>(defaultSample.content);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce text changes (200 ms) and enforce 50,000 char cap
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_INPUT_CHARS);
    setText(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedText(val);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const config: ChunkingConfig = useMemo(
    () => ({
      strategy,
      chunkSize,
      chunkOverlap: Math.min(chunkOverlap, Math.max(0, chunkSize - 1)),
      unit,
      encoding: 'o200k_base',
    }),
    [strategy, chunkSize, chunkOverlap, unit]
  );

  // Execute real chunker directly on the main thread (runs in < 4 ms for 50k chars)
  const chunks: ChunkMetadata[] = useMemo(() => {
    if (!debouncedText.trim()) return [];
    try {
      switch (config.strategy) {
        case 'fixed':
          return chunkFixed(debouncedText, config);
        case 'recursive':
          return chunkRecursive(debouncedText, config);
        case 'markdown':
          return chunkMarkdown(debouncedText, config);
        case 'sentence':
          return chunkSentence(debouncedText, config);
        case 'tabular':
          return chunkTabular(debouncedText, config);
        default:
          return chunkRecursive(debouncedText, config);
      }
    } catch (err) {
      console.warn('Chunking error in sandbox:', err);
      return [];
    }
  }, [debouncedText, config]);

  useEffect(() => {
    setAnnouncement(
      `Partitioned document into ${chunks.length} chunks using ${strategy} strategy (${chunkSize} size, ${chunkOverlap} overlap).`
    );
  }, [chunks.length, strategy, chunkSize, chunkOverlap]);

  const handleUnitToggle = (newUnit: ChunkUnit) => {
    if (newUnit === 'tokens' && unit !== 'tokens') {
      setShowTokenWarning(true);
    } else {
      setUnit(newUnit);
      setShowTokenWarning(false);
    }
  };

  const handleConfirmTokenMode = async () => {
    setUnit('tokens');
    setShowTokenWarning(false);
    try {
      const { countTokens, getTokenizer } = await import('../../../engine/tokenizers/tokenizer');
      setChunkerTokenizerContext({
        countTokens: (text, enc) => countTokens(text, enc as any),
        getTokenizer: (enc) => getTokenizer(enc as any),
      });
    } catch (err) {
      console.warn('Failed to dynamically load tokenizer in sandbox:', err);
    }
  };

  const handlePresetChange = (sampleId: string) => {
    const found = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (found) {
      setText(found.content);
      setDebouncedText(found.content);
      setSelectedChunkIndex(0);
    }
  };

  const shareUrl = useMemo(() => {
    return generateShareableUrl(config, initialSampleId);
  }, [config, initialSampleId]);

  const tableAlternative = (
    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border-b border-slate-300 dark:border-slate-700">
        <tr>
          <th className="p-2 border">Index</th>
          <th className="p-2 border">Length ({unit})</th>
          <th className="p-2 border">Approx Tokens</th>
          <th className="p-2 border">Character Range</th>
          <th className="p-2 border">Text Preview</th>
        </tr>
      </thead>
      <tbody>
        {chunks.map((c) => (
          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <td className="p-2 border font-mono">#{c.index + 1}</td>
            <td className="p-2 border">{c.charCount}</td>
            <td className="p-2 border">{c.tokenCount}</td>
            <td className="p-2 border font-mono text-xs">
              [{c.startCharIndex}..{c.endCharIndex}]
            </td>
            <td className="p-2 border truncate max-w-xs">{c.text.slice(0, 80)}...</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const selectedChunk = chunks[selectedChunkIndex] || chunks[0];

  return (
    <WidgetContainer
      title="Live Document Chunking Sandbox"
      engineType="real"
      description="Runs the real ChunkLens partitioning engine locally in your browser with zero remote egress."
      tableAlternative={tableAlternative}
      ariaAnnouncement={announcement}
      onReset={() => {
        setStrategy('recursive');
        setChunkSize(400);
        setChunkOverlap(40);
        setUnit('characters');
        setText(defaultSample.content);
        setDebouncedText(defaultSample.content);
        setSelectedChunkIndex(0);
      }}
    >
      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Strategy Selector */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as ChunkingStrategy)}
            className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-[36px]"
          >
            <option value="fixed">Fixed-Size</option>
            <option value="recursive">Recursive Hierarchy</option>
            <option value="markdown">Markdown-Aware</option>
            <option value="sentence">Sentence Boundary</option>
            <option value="tabular">Tabular / CSV</option>
          </select>
        </div>

        {/* Chunk Size Slider */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Size</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {chunkSize} {unit}
            </span>
          </div>
          <input
            id="v2-sandbox-chunk-size"
            aria-label="Chunk size in units"
            type="range"
            min="100"
            max="2000"
            step="50"
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
            style={{ height: '28px', minHeight: '28px' }}
            className="w-full h-7 accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Chunk Overlap Slider */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Overlap</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {chunkOverlap} {unit}
            </span>
          </div>
          <input
            id="v2-sandbox-chunk-overlap"
            aria-label="Chunk overlap in units"
            type="range"
            min="0"
            max={Math.max(0, chunkSize - 50)}
            step="10"
            value={chunkOverlap}
            onChange={(e) => setChunkOverlap(Number(e.target.value))}
            style={{ height: '28px', minHeight: '28px' }}
            className="w-full h-7 accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Unit & Sample Presets */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Sample Preset
          </label>
          <select
            defaultValue={initialSampleId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-[36px]"
          >
            {SAMPLE_DOCUMENTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unit switch bar */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400">Measurement Unit:</span>
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleUnitToggle('characters')}
              className={`px-2.5 py-1 rounded text-xs font-medium min-h-[24px] ${
                unit === 'characters'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Characters
            </button>
            <button
              type="button"
              onClick={() => handleUnitToggle('tokens')}
              className={`px-2.5 py-1 rounded text-xs font-medium min-h-[24px] ${
                unit === 'tokens'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tokens (Approx)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500">
            {chunks.length} chunks generated ({text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} chars)
          </span>
        </div>
      </div>

      {/* Token mode warning dialog if clicked */}
      {showTokenWarning && (
        <div className="mb-4 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-semibold block mb-0.5">Exact BPE Tokenization Note:</span>
            <span>
              Exact BPE tokenization relies on BPE dictionary lookup. In this preview sandbox, calibrated ~4 chars/token approximation runs instantly on the main thread.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmTokenMode}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium min-h-[32px]"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => setShowTokenWarning(false)}
              className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-h-[32px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Interactive 2-column layout: Text Editor & Chunk Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Source Text Area */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Editable Source Document</span>
            <span className="font-mono text-slate-500">{text.length} chars</span>
          </div>
          <textarea
            value={text}
            onChange={handleTextChange}
            rows={10}
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            placeholder="Paste text here to inspect partition boundaries..."
          />
        </div>

        {/* Chunk Ribbon / Boundary Cards */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <span>Resulting Chunks ({chunks.length})</span>
            <span className="text-slate-500">Click a chunk to inspect</span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Resulting chunks list"
            className="max-h-[240px] overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {chunks.map((c, idx) => {
              const isSelected = idx === selectedChunkIndex;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedChunkIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all min-h-[44px] flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="truncate flex-1">
                    <span className="font-mono font-bold mr-2 text-indigo-600 dark:text-indigo-400">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-xs text-slate-500 mr-2">
                      [{c.startCharIndex}..{c.endCharIndex}]
                    </span>
                    <span className="truncate">{c.text.slice(0, 60)}...</span>
                  </div>
                  <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {c.charCount} chars
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Chunk Inspection Preview */}
      {selectedChunk && (
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 mb-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Chunk #{selectedChunk.index + 1} Payload Preview
            </span>
            <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
              <span>Chars: {selectedChunk.charCount}</span>
              <span>Approx Tokens: {selectedChunk.tokenCount}</span>
              {selectedChunk.overlapPrevChars > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  Overlap Prev: {selectedChunk.overlapPrevChars}
                </span>
              )}
            </div>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="Selected chunk text preview"
            className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-40 overflow-y-auto focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {selectedChunk.text}
          </div>
        </div>
      )}

      {/* Launch in Workbench Button */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
        <span className="text-slate-500">
          Want deep heatmap similarity analysis and multi-model token comparison?
        </span>
        <a
          href={shareUrl}
          onClick={(e) => {
            if (onLaunchWorkbench) {
              e.preventDefault();
              onLaunchWorkbench(shareUrl);
            }
          }}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors inline-flex items-center gap-1.5 min-h-[36px] shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span>Open Full Workbench</span>
          <span>→</span>
        </a>
      </div>
    </WidgetContainer>
  );
};
