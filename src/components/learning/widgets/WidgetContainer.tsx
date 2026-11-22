import React, { useState } from 'react';

export type WidgetEngineType = 'illustration' | 'real';

interface WidgetContainerProps {
  title: string;
  engineType: WidgetEngineType;
  description?: string;
  tableAlternative?: React.ReactNode;
  children: React.ReactNode;
  onReset?: () => void;
  ariaAnnouncement?: string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  engineType,
  description,
  tableAlternative,
  children,
  onReset,
  ariaAnnouncement,
}) => {
  const [showTableAlt, setShowTableAlt] = useState(false);

  return (
    <figure
      role="group"
      aria-labelledby="widget-title"
      className="learn-widget my-6 rounded-xl border border-separator bg-surface-1 shadow-card overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-4 py-3 bg-surface-2/60 border-b border-separator flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              engineType === 'real'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-accent-subtle text-accent border border-accent/25'
            }`}
          >
            {engineType === 'real' ? 'Real engine' : 'Illustration'}
          </span>
          <h4 id="widget-title" className="text-sm font-semibold text-text">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {tableAlternative && (
            <button
              type="button"
              onClick={() => setShowTableAlt((prev) => !prev)}
              aria-pressed={showTableAlt}
              className="text-xs font-medium px-2.5 py-1 rounded border border-separator text-text-secondary hover:bg-surface-2 transition-colors min-h-[28px] focus-ring"
            >
              {showTableAlt ? 'Show Interactive' : 'Accessible Table'}
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium px-2.5 py-1 rounded border border-separator text-text-secondary hover:bg-surface-2 transition-colors min-h-[28px] focus-ring"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {description && (
        <div className="px-4 pt-2.5 text-xs text-text-muted">
          {description}
        </div>
      )}

      {/* Screen reader aria-live announcements */}
      <div aria-live="polite" className="sr-only">
        {ariaAnnouncement}
      </div>

      {/* Main content body */}
      <div className="p-4 sm:p-5">
        {showTableAlt && tableAlternative ? (
          <div
            tabIndex={0}
            role="region"
            aria-label="Tabular data alternative"
            className="overflow-x-auto focus-ring"
          >
            {tableAlternative}
          </div>
        ) : (
          children
        )}
      </div>
    </figure>
  );
};
