import React, { useRef, useState } from 'react';
import { ChunkingConfig, ChunkingStrategy, TokenizerEncoding, ChunkUnit } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { Sliders, BookOpen, Upload, Cpu, ListFilter } from 'lucide-react';
import { cn } from '../utils/cn';

interface ControlsPanelProps {
  config: ChunkingConfig;
  onChangeConfig: (newConfig: ChunkingConfig) => void;
  selectedSampleId: string | null;
  onSelectSample: (id: string) => void;
  onFileUpload: (text: string, filename: string) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  config,
  onChangeConfig,
  selectedSampleId,
  onSelectSample,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [separatorsText, setSeparatorsText] = useState<string>(
    config.separators ? config.separators.map((s) => JSON.stringify(s)).join(', ') : ''
  );

  const handleSeparatorsChange = (raw: string) => {
    setSeparatorsText(raw);
    if (!raw.trim()) {
      onChangeConfig({ ...config, separators: undefined });
      return;
    }
    const parts = raw.split(',').map((s) => {
      let t = s.trim();
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1);
      }
      return t.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    });
    onChangeConfig({ ...config, separators: parts });
  };

  const handleResetSeparators = () => {
    setSeparatorsText('');
    onChangeConfig({ ...config, separators: undefined });
  };

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeConfig({
      ...config,
      strategy: e.target.value as ChunkingStrategy,
    });
  };

  const handleUnitToggle = (unit: ChunkUnit) => {
    // Sensible defaults when switching units
    const newChunkSize = unit === 'tokens' ? Math.min(500, config.chunkSize) : Math.max(1000, config.chunkSize * 4);
    const newOverlap = unit === 'tokens' ? Math.min(50, config.chunkOverlap) : Math.max(100, config.chunkOverlap * 4);
    onChangeConfig({
      ...config,
      unit,
      chunkSize: newChunkSize,
      chunkOverlap: newOverlap,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 10MB limit to protect browser memory and responsiveness
    if (file.size > 10 * 1024 * 1024) {
      alert('Selected file exceeds 10 MB limit. Please upload a smaller text document to maintain real-time performance.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (typeof text === 'string') {
        if (!text.trim()) {
          alert(`File "${file.name}" is empty or contains only whitespace.`);
          return;
        }
        onFileUpload(text, file.name);
      }
    };
    reader.onerror = () => {
      console.error('Failed to read file:', file.name);
      alert(`Error reading file: ${file.name}`);
    };
    reader.readAsText(file);
    // Reset file input value so re-uploading the same file triggers change
    e.target.value = '';
  };

  return (
    <div className="bg-panel border-b border-border p-4 space-y-3.5">
      {/* Sample Pills & Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary-400" />
            Corpus:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample.id)}
                className={cn(
                  'h-7 text-xs px-2.5 rounded active-press focus-ring transition-colors',
                  selectedSampleId === sample.id
                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/40 font-medium'
                    : 'bg-surface text-slate-400 border border-border hover:text-slate-200 hover:border-border-hover'
                )}
              >
                {sample.title.split(' ')[0]} {sample.title.split(' ')[1] || ''}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Custom Document */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.json,.csv,.py,.js,.ts"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-7 flex items-center space-x-1.5 text-xs px-2.5 rounded bg-surface text-slate-300 border border-border hover:bg-subtle hover:border-border-hover active-press focus-ring transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-border">
        {/* Strategy Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary-400" />
              Algorithm
            </span>
          </label>
          <select
            value={config.strategy}
            onChange={handleStrategyChange}
            className="h-8 w-full bg-canvas border border-border rounded px-2.5 text-xs text-slate-200 focus-ring hover:border-border-hover transition-colors"
          >
            <option value="recursive">Recursive Character (LangChain)</option>
            <option value="markdown">Markdown AST (Header-Aware)</option>
            <option value="sentence">Sentence Boundary (LlamaIndex)</option>
            <option value="fixed">Fixed Window (Sliding)</option>
          </select>
        </div>

        {/* Unit & Encoding Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-accent-cyan" />
              Unit & Encoding
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Unit Buttons */}
            <div className="flex h-8 bg-canvas p-0.5 rounded border border-border">
              <button
                onClick={() => handleUnitToggle('tokens')}
                className={cn(
                  'flex-1 text-[11px] rounded active-press focus-ring transition-colors',
                  config.unit === 'tokens'
                    ? 'bg-primary-600/30 text-primary-200 font-semibold border border-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Tokens
              </button>
              <button
                onClick={() => handleUnitToggle('characters')}
                className={cn(
                  'flex-1 text-[11px] rounded active-press focus-ring transition-colors',
                  config.unit === 'characters'
                    ? 'bg-primary-600/30 text-primary-200 font-semibold border border-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Chars
              </button>
            </div>

            {/* Tokenizer Model */}
            <select
              value={config.encoding}
              onChange={(e) =>
                onChangeConfig({ ...config, encoding: e.target.value as TokenizerEncoding })
              }
              className="h-8 bg-canvas border border-border rounded px-2 text-[11px] text-slate-200 focus-ring hover:border-border-hover transition-colors"
            >
              <option value="o200k_base">GPT-4o (o200k)</option>
              <option value="cl100k_base">GPT-4 (cl100k)</option>
            </select>
          </div>
        </div>

        {/* Chunk Size Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Target Size</span>
            <span className="text-xs font-mono font-semibold tabular-nums text-primary-400">
              {config.chunkSize} {config.unit}
            </span>
          </div>
          <input
            type="range"
            min={config.unit === 'tokens' ? 50 : 200}
            max={config.unit === 'tokens' ? 2048 : 8000}
            step={config.unit === 'tokens' ? 25 : 100}
            value={config.chunkSize}
            onChange={(e) => {
              const newSize = parseInt(e.target.value, 10) || 500;
              const maxOverlap = Math.floor(newSize * 0.5);
              onChangeConfig({
                ...config,
                chunkSize: newSize,
                chunkOverlap: Math.min(config.chunkOverlap, maxOverlap),
              });
            }}
            className="w-full accent-primary-500 bg-surface h-1.5 rounded appearance-none cursor-pointer focus-ring"
          />
        </div>

        {/* Chunk Overlap Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Overlap Window</span>
            <span className="text-xs font-mono font-semibold tabular-nums text-accent-amber">
              {config.chunkOverlap} {config.unit}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.floor(config.chunkSize * 0.5)}
            step={config.unit === 'tokens' ? 5 : 20}
            value={config.chunkOverlap}
            onChange={(e) => {
              const maxOverlap = Math.floor(config.chunkSize * 0.5);
              const requested = parseInt(e.target.value, 10) || 0;
              onChangeConfig({
                ...config,
                chunkOverlap: Math.min(requested, maxOverlap),
              });
            }}
            className="w-full accent-amber-500 bg-surface h-1.5 rounded appearance-none cursor-pointer focus-ring"
          />
        </div>
      </div>

      {/* Advanced Recursive Separator Hierarchy Control */}
      {config.strategy === 'recursive' && (
        <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-400 flex items-center gap-1.5 text-[11px]">
              <ListFilter className="h-3 w-3 text-primary-400" />
              Precedence Delimiters:
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface text-primary-300 border border-border">
              {JSON.stringify(config.separators || ['\\n\\n', '\\n', '. ', ' ', ''])}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder='e.g. "\\n\\n", "\\n", ". ", " ", ""'
              value={separatorsText}
              onChange={(e) => handleSeparatorsChange(e.target.value)}
              className="h-7 bg-canvas border border-border rounded px-2.5 text-slate-200 text-xs font-mono w-72 focus-ring hover:border-border-hover transition-colors"
              title="Comma-separated delimiter list in descending order of precedence"
            />
            {config.separators && (
              <button
                onClick={handleResetSeparators}
                className="h-7 text-[11px] text-slate-400 hover:text-slate-200 px-2 rounded bg-surface border border-border active-press focus-ring transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
