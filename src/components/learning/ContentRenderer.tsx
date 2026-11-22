import React, { Suspense, lazy } from 'react';
import { parseLearnMarkdown, ParsedDocument, ContentBlock } from '../../engine/learning/parser';
import { parseInline, InlineToken } from '../../engine/learning/inlineParser';
import { GlossaryPopover } from './GlossaryPopover';
import { QuizWidget } from './QuizWidget';
import { generateShareableUrl } from '../../utils/shareUrl';
import { SAMPLE_DOCUMENTS } from '../../data/samples';
import { ChunkingConfig, ChunkingStrategy } from '../../engine/types';

// Lazy-loaded interactive simulation widgets
const V1PipelineFlowExplorer = lazy(() =>
  import('./widgets/V1PipelineFlowExplorer').then((m) => ({ default: m.V1PipelineFlowExplorer }))
);
const V2ChunkSandbox = lazy(() =>
  import('./widgets/V2ChunkSandbox').then((m) => ({ default: m.V2ChunkSandbox }))
);

interface ContentRendererProps {
  content: string | ParsedDocument;
  onNavigateLesson?: (slug: string) => void;
  onLaunchWorkbench?: (shareParams?: string) => void;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  onNavigateLesson,
  onLaunchWorkbench,
}) => {
  const doc: ParsedDocument =
    typeof content === 'string' ? parseLearnMarkdown(content) : content;

  const renderInlineTokens = (tokens: InlineToken[]) => {
    return tokens.map((token, idx) => {
      switch (token.type) {
        case 'text':
          return <React.Fragment key={idx}>{token.content}</React.Fragment>;
        case 'bold':
          return <strong key={idx} className="font-semibold text-slate-900 dark:text-slate-100">{token.content}</strong>;
        case 'italic':
          return <em key={idx} className="italic">{token.content}</em>;
        case 'code':
          return (
            <code
              key={idx}
              className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
            >
              {token.content}
            </code>
          );
        case 'link':
          if (token.url.startsWith('lesson:')) {
            const lessonSlug = token.url.replace('lesson:', '');
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigateLesson && onNavigateLesson(lessonSlug)}
                className="text-accent underline hover:opacity-80 font-medium"
              >
                {token.text}
              </button>
            );
          }
          return (
            <a
              key={idx}
              href={token.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline hover:opacity-80 font-medium"
            >
              {token.text}
            </a>
          );
        case 'glossary':
          return (
            <GlossaryPopover
              key={idx}
              termId={token.termId}
              label={token.label}
            />
          );
        default:
          return null;
      }
    });
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'heading': {
        const HeadingTag = `h${Math.min(block.level, 6)}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            key={index}
            id={block.id}
            className={`group flex items-center gap-2 ${
              block.level === 1
                ? 'text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4'
                : block.level === 2
                ? 'text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800'
                : 'text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-2'
            }`}
          >
            <span>{block.text}</span>
            <a
              href={`#${block.id}`}
              aria-label={`Direct link to ${block.text}`}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity p-1 text-sm rounded min-h-[24px] min-w-[24px] inline-flex items-center justify-center"
            >
              #
            </a>
          </HeadingTag>
        );
      }
      case 'paragraph': {
        const tokens = parseInline(block.text);
        return (
          <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed my-3.5">
            {renderInlineTokens(tokens)}
          </p>
        );
      }
      case 'list': {
        const ListTag = block.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={index}
            className={`my-3.5 pl-6 space-y-1.5 text-slate-700 dark:text-slate-300 ${
              block.ordered ? 'list-decimal' : 'list-disc'
            }`}
          >
            {block.items.map((item, itemIdx) => (
              <li key={itemIdx} className="leading-relaxed">
                {renderInlineTokens(parseInline(item))}
              </li>
            ))}
          </ListTag>
        );
      }
      case 'code':
        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
            <div className="px-4 py-1.5 learn-code-header flex items-center justify-between text-xs font-mono">
              <span>{block.language || 'code'}</span>
            </div>
            <pre tabIndex={0} role="region" aria-label="Code block" className="p-4 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto focus:outline-none focus:ring-1 focus:ring-slate-500">
              <code>{block.code}</code>
            </pre>
          </div>
        );
      case 'blockquote':
        return (
          <blockquote
            key={index}
            className="my-4 pl-4 border-l-4 border-accent italic text-text-secondary bg-surface-2/40 py-1.5 rounded-r"
          >
            {renderInlineTokens(parseInline(block.text))}
          </blockquote>
        );
      case 'table':
        return (
          <div key={index} tabIndex={0} role="region" aria-label="Content table" className="my-5 overflow-x-auto rounded-lg border border-separator focus-ring">
            <table className="w-full text-left text-sm text-text-secondary border-collapse">
              <thead className="bg-surface-2 border-b border-separator text-text font-semibold">
                <tr>
                  {block.headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/60">
                {block.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-surface-2/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5">
                        {renderInlineTokens(parseInline(cell))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'callout': {
        const typeStyles = {
          note: 'bg-surface-2 border-separator text-text',
          tip: 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-200',
          warning: 'bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200',
          info: 'bg-accent-subtle border-accent text-text',
        }[block.calloutType];

        return (
          <aside
            key={index}
            role="note"
            className={`my-4 p-4 rounded-lg border-l-4 ${typeStyles}`}
          >
            <h4 className="font-semibold text-sm mb-1">
              {block.title}
            </h4>
            <div className="text-sm leading-relaxed">
              {renderInlineTokens(parseInline(block.content))}
            </div>
          </aside>
        );
      }
      case 'widget': {
        const fallback = (
          <div className="my-6 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-center text-sm text-slate-500 flex items-center justify-center min-h-[220px]">
            <span>Loading interactive widget...</span>
          </div>
        );

        if (block.widgetId === 'v1-pipeline') {
          return (
            <Suspense key={index} fallback={fallback}>
              <V1PipelineFlowExplorer {...block.props} />
            </Suspense>
          );
        }
        if (block.widgetId === 'v2-sandbox') {
          return (
            <Suspense key={index} fallback={fallback}>
              <V2ChunkSandbox {...block.props} />
            </Suspense>
          );
        }
        return (
          <div key={index} className="p-4 border rounded text-xs text-slate-500">
            Widget [{block.widgetId}]
          </div>
        );
      }
      case 'quiz':
        return <QuizWidget key={index} quizId={block.quizId} />;
      case 'compare':
        return (
          <div key={index} className="learn-compare-grid my-5">
            <div className="learn-compare-card p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                {block.leftTitle}
              </h4>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                {block.leftContent.split('\n\n').map((p, pIdx) => (
                  <p key={pIdx}>{renderInlineTokens(parseInline(p))}</p>
                ))}
              </div>
            </div>
            <div className="learn-compare-card p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                {block.rightTitle}
              </h4>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                {block.rightContent.split('\n\n').map((p, pIdx) => (
                  <p key={pIdx}>{renderInlineTokens(parseInline(p))}</p>
                ))}
              </div>
            </div>
          </div>
        );
      case 'tryit': {
        const sample =
          SAMPLE_DOCUMENTS.find((s) => s.id === block.presetId) || SAMPLE_DOCUMENTS[0];
        const strategy = (block.props.strategy as ChunkingStrategy) || 'recursive';
        const chunkSize = block.props.chunkSize ? parseInt(block.props.chunkSize, 10) : 400;
        const chunkOverlap = block.props.chunkOverlap ? parseInt(block.props.chunkOverlap, 10) : 40;

        const config: ChunkingConfig = {
          strategy,
          chunkSize,
          chunkOverlap,
          unit: 'characters',
          encoding: 'o200k_base',
        };

        const shareUrl = generateShareableUrl(config, sample.id, sample.title);

        return (
          <div
            key={index}
            className="my-5 p-4 sm:p-5 rounded-xl border border-separator bg-surface-2/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <span className="text-xs font-semibold text-accent block mb-1">
                Workbench Experiment
              </span>
              <h4 className="font-semibold text-text text-base">
                Try this configuration in ChunkLens
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Preset: <span className="font-medium">{sample.title}</span> ({sample.category}) • {strategy} ({chunkSize}/{chunkOverlap})
              </p>
            </div>
            <a
              href={shareUrl}
              onClick={(e) => {
                if (onLaunchWorkbench) {
                  e.preventDefault();
                  onLaunchWorkbench(shareUrl);
                }
              }}
              className="px-4 py-2 rounded-lg learn-primary-btn text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 min-h-[38px] shadow-sm whitespace-nowrap focus-ring"
            >
              <span>Open in Workbench</span>
              <span>→</span>
            </a>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <article className="learn-prose max-w-none">
      {doc.blocks.map(renderBlock)}
    </article>
  );
};
