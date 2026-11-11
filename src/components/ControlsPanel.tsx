import React, { useRef, useState } from 'react';
import { ChunkingConfig, ChunkingStrategy, TokenizerEncoding, ChunkUnit } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { Sliders, Sparkles, Upload, Cpu, ListFilter } from 'lucide-react';
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
    <div className="bg-surface border-b border-slate-800 p-4 space-y-4">
      {/* Sample Pills & Upload */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            Samples:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample.id)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-md transition-colors',
                  selectedSampleId === sample.id
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 font-medium'
                    : 'bg-surface-elevated text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
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
            className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md bg-surface-elevated text-slate-300 border border-slate-700 hover:border-primary-500/60 transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-primary-400" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
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
            className="w-full bg-[#090d16] border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
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
              Measurement & Tokenizer
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* Unit Buttons */}
            <div className="flex bg-[#090d16] p-0.5 rounded-md border border-slate-700">
              <button
                onClick={() => handleUnitToggle('tokens')}
                className={cn(
                  'flex-1 text-[11px] py-1 rounded transition-colors',
                  config.unit === 'tokens'
                    ? 'bg-primary-500/30 text-primary-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Tokens
              </button>
              <button
                onClick={() => handleUnitToggle('characters')}
                className={cn(
                  'flex-1 text-[11px] py-1 rounded transition-colors',
                  config.unit === 'characters'
                    ? 'bg-primary-500/30 text-primary-200 font-semibold'
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
              className="bg-[#090d16] border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-primary-500"
            >
              <option value="o200k_base">GPT-4o (o200k)</option>
              <option value="cl100k_base">GPT-4 (cl100k)</option>
            </select>
          </div>
        </div>

        {/* Chunk Size Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Chunk Size</span>
            <span className="text-xs font-mono font-semibold text-primary-400">
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
            className="w-full accent-primary-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Chunk Overlap Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Chunk Overlap</span>
            <span className="text-xs font-mono font-semibold text-accent-amber">
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
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Advanced Recursive Separator Hierarchy Control */}
      {config.strategy === 'recursive' && (
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-400 flex items-center gap-1.5 text-[11px]">
              <ListFilter className="h-3 w-3 text-primary-400" />
              Delimiter Hierarchy:
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-primary-300 border border-slate-700">
              {JSON.stringify(config.separators || ['\\n\\n', '\\n', '. ', ' ', ''])}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder='e.g. "\\n\\n", "\\n", ". ", " ", ""'
              value={separatorsText}
              onChange={(e) => handleSeparatorsChange(e.target.value)}
              className="bg-[#090d16] border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs font-mono w-72 focus:outline-none focus:border-primary-500"
              title="Comma-separated delimiter list in descending order of precedence"
            />
            {config.separators && (
              <button
                onClick={handleResetSeparators}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors"
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
