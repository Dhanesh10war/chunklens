import React, { useState } from 'react';
import { WidgetContainer } from './WidgetContainer';

interface PipelineStage {
  id: number;
  name: string;
  shortLabel: string;
  role: string;
  input: string;
  operation: string;
  output: string;
  failureMode: string;
}

const STAGES: PipelineStage[] = [
  {
    id: 1,
    name: '1. Document Ingestion & Extraction',
    shortLabel: 'Ingest',
    role: 'Converts raw source formats into machine-readable plain text.',
    input: 'PDFs, DOCX, Markdown, HTML, CSV files',
    operation: 'Strips markup headers, extracts text streams, and removes noisy artifacts.',
    output: 'Clean UTF-8 plain text string',
    failureMode: 'OCR degradation, lost table layouts, garbled multi-column reading order.',
  },
  {
    id: 2,
    name: '2. Chunking & Overlap Partitioning',
    shortLabel: 'Chunk',
    role: 'Slices continuous text into bounded passages calibrated for model attention.',
    input: 'Full plain text string',
    operation: 'Applies fixed, recursive, markdown, or sentence rules with overlap window.',
    output: 'Array of bounded ChunkMetadata (text, token count, offsets)',
    failureMode: 'Context cliffs (split mid-sentence), orphan chunks, semantic dilution.',
  },
  {
    id: 3,
    name: '3. Dense Vector Embedding',
    shortLabel: 'Embed',
    role: 'Translates textual semantics into high-dimensional geometric coordinates.',
    input: 'Individual chunk text strings',
    operation: 'Embedding model maps token sequence to floating point vector array (e.g. 1536d).',
    output: 'Dense vector embeddings (e.g. [0.012, -0.045, ...])',
    failureMode: 'Information bottleneck on oversized chunks, domain shift on technical jargon.',
  },
  {
    id: 4,
    name: '4. Vector Search & Retrieval',
    shortLabel: 'Retrieve',
    role: 'Finds top-k most relevant chunks matching the user query.',
    input: 'User query string (embedded) + vector index',
    operation: 'Approximate Nearest Neighbor (ANN) search via cosine similarity or hybrid BM25.',
    output: 'Top-k candidate chunks ranked by relevance score',
    failureMode: 'Semantic bloat, returning redundant duplicate chunks, low keyword recall.',
  },
  {
    id: 5,
    name: '5. Context Augmentation & Generation',
    shortLabel: 'Generate',
    role: 'Synthesizes an authoritative answer grounded in the retrieved passages.',
    input: 'Prompt template + Top-k chunks + User query',
    operation: 'LLM attends across the retrieved context and generates factual response.',
    output: 'Final user-facing response with cited sources',
    failureMode: 'Hallucination when context is missing, lost-in-the-middle on bloated prompts.',
  },
];

export const V1PipelineFlowExplorer: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState(2); // Start on Chunking stage
  const [announcement, setAnnouncement] = useState('Selected stage 2: Chunking & Overlap Partitioning');

  const currentStage = STAGES.find((s) => s.id === activeStageId) || STAGES[1];

  const handleSelectStage = (stageId: number) => {
    setActiveStageId(stageId);
    const s = STAGES.find((item) => item.id === stageId);
    if (s) {
      setAnnouncement(`Selected stage ${s.id}: ${s.name}`);
    }
  };

  const handleNext = () => {
    if (activeStageId < STAGES.length) {
      handleSelectStage(activeStageId + 1);
    }
  };

  const handlePrev = () => {
    if (activeStageId > 1) {
      handleSelectStage(activeStageId - 1);
    }
  };

  const tableAlternative = (
    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border-b border-slate-300 dark:border-slate-700">
        <tr>
          <th className="p-2 border">Stage</th>
          <th className="p-2 border">Input</th>
          <th className="p-2 border">Operation</th>
          <th className="p-2 border">Output</th>
          <th className="p-2 border">Common Failure Mode</th>
        </tr>
      </thead>
      <tbody>
        {STAGES.map((s) => (
          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <td className="p-2 border font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
            <td className="p-2 border">{s.input}</td>
            <td className="p-2 border">{s.operation}</td>
            <td className="p-2 border">{s.output}</td>
            <td className="p-2 border text-red-700 dark:text-red-400">{s.failureMode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <WidgetContainer
      title="RAG Pipeline Flow Simulator"
      engineType="illustration"
      description="Interactive visual model mapping the 5 lifecycle stages of retrieval-augmented generation."
      tableAlternative={tableAlternative}
      ariaAnnouncement={announcement}
      onReset={() => handleSelectStage(2)}
    >
      {/* Visual stage step tabs */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-6">
        {STAGES.map((s) => {
          const isActive = s.id === activeStageId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectStage(s.id)}
              aria-pressed={isActive}
              className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all min-h-[44px] flex flex-col justify-between ${
                isActive
                  ? 'border-accent bg-accent-subtle text-text ring-2 ring-accent/20 font-semibold'
                  : 'border-separator bg-surface-1 text-text-secondary hover:border-text-secondary'
              }`}
            >
              <span className="text-xs font-mono font-semibold block opacity-70">
                0{s.id}
              </span>
              <span className="text-xs sm:text-sm font-semibold truncate block">
                {s.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Flow Diagram (Inline SVG) */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Interactive pipeline flow diagram"
        className="mb-6 p-4 rounded-xl bg-slate-950 text-white border border-slate-800 overflow-x-auto focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        <svg
          viewBox="0 0 700 110"
          className="w-full min-w-[560px] h-auto"
          aria-hidden="true"
        >
          {/* Connector lines */}
          <line x1="70" y1="55" x2="630" y2="55" stroke="#334155" strokeWidth="3" />
          <line
            x1="70"
            y1="55"
            x2={70 + (activeStageId - 1) * 140}
            y2="55"
            stroke="#6366f1"
            strokeWidth="3.5"
            className="transition-all duration-300"
          />

          {STAGES.map((s, idx) => {
            const cx = 70 + idx * 140;
            const isCompleted = s.id < activeStageId;
            const isCurrent = s.id === activeStageId;

            return (
              <g
                key={s.id}
                className="cursor-pointer"
                onClick={() => handleSelectStage(s.id)}
              >
                <circle
                  cx={cx}
                  cy="55"
                  r={isCurrent ? '22' : '16'}
                  fill={isCurrent ? '#6366f1' : isCompleted ? '#4f46e5' : '#1e293b'}
                  stroke={isCurrent ? '#a5b4fc' : '#475569'}
                  strokeWidth={isCurrent ? '3' : '1.5'}
                  className="transition-all duration-200"
                />
                <text
                  x={cx}
                  y="59"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isCurrent ? '13' : '11'}
                  fontWeight="bold"
                >
                  {s.id}
                </text>
                <text
                  x={cx}
                  y="92"
                  textAnchor="middle"
                  fill={isCurrent ? '#e0e7ff' : '#94a3b8'}
                  fontSize="11"
                  fontWeight={isCurrent ? '600' : 'normal'}
                >
                  {s.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active Stage Detail Card */}
      <div className="p-4 sm:p-5 rounded-xl border border-separator bg-surface-2/40">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-semibold text-accent">
              Stage 0{currentStage.id}
            </span>
            <h5 className="text-base sm:text-lg font-bold text-text">
              {currentStage.name}
            </h5>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activeStageId === 1}
              onClick={handlePrev}
              aria-label="Previous pipeline stage"
              className="p-1.5 rounded border border-separator disabled:opacity-40 hover:bg-surface-2 text-text min-h-[32px] min-w-[32px] flex items-center justify-center text-xs"
            >
              ←
            </button>
            <button
              type="button"
              disabled={activeStageId === STAGES.length}
              onClick={handleNext}
              aria-label="Next pipeline stage"
              className="p-1.5 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 min-h-[32px] min-w-[32px] flex items-center justify-center text-xs"
            >
              →
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
          {currentStage.role}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Input
            </span>
            <span className="text-slate-800 dark:text-slate-200">{currentStage.input}</span>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Output
            </span>
            <span className="text-slate-800 dark:text-slate-200">{currentStage.output}</span>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:col-span-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Transformation Operation
            </span>
            <span className="text-slate-800 dark:text-slate-200">{currentStage.operation}</span>
          </div>

          <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 sm:col-span-2">
            <span className="font-semibold text-red-600 dark:text-red-400 block mb-1">
              Primary Failure Mode to Prevent
            </span>
            <span className="text-red-900 dark:text-red-200">{currentStage.failureMode}</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};
