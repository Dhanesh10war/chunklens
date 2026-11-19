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
      className="learn-widget my-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded ${
              engineType === 'real'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
            }`}
          >
            {engineType === 'real' ? 'Real engine' : 'Illustration'}
          </span>
          <h4 id="widget-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {tableAlternative && (
            <button
              type="button"
              onClick={() => setShowTableAlt((prev) => !prev)}
              aria-pressed={showTableAlt}
              className="text-xs font-medium px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[28px] focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {showTableAlt ? 'Show Interactive' : 'Accessible Table'}
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[28px] focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {description && (
        <div className="px-4 pt-2.5 text-xs text-slate-500 dark:text-slate-400">
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
          <div className="overflow-x-auto">{tableAlternative}</div>
        ) : (
          children
        )}
      </div>
    </figure>
  );
};
