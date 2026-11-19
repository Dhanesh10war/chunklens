import React, { useState, useRef, useEffect } from 'react';
import { findGlossaryTerm, GLOSSARY_TERMS } from '../../data/learning/glossary';
import { GlossaryTerm } from '../../data/learning/types';

interface GlossaryPopoverProps {
  termId: string;
  label?: string;
  onNavigateTerm?: (targetTermId: string) => void;
}

export const GlossaryPopover: React.FC<GlossaryPopoverProps> = ({
  termId,
  label,
  onNavigateTerm,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState<GlossaryTerm | undefined>(() =>
    findGlossaryTerm(termId)
  );
  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTerm(findGlossaryTerm(termId));
  }, [termId]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const term = activeTerm;
  const displayText = label || term?.term || termId;

  if (!term) {
    return <span className="font-medium underline decoration-dotted">{displayText}</span>;
  }

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="learn-glossary-trigger underline decoration-dotted decoration-blue-400 dark:decoration-blue-500 font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-0.5"
        title={`Glossary definition: ${term.term}`}
      >
        {displayText}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Definition of ${term.term}`}
          className="learn-glossary-popover absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl text-left text-sm"
        >
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {term.term}
              </h4>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {term.category}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close definition"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center rounded"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-2">
            {term.definition}
          </p>

          {term.formulaOrExample && (
            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto">
              {term.formulaOrExample}
            </div>
          )}

          {term.seeAlso && term.seeAlso.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">See also: </span>
              {term.seeAlso.map((sa, idx) => {
                const found = GLOSSARY_TERMS.find((gt) => gt.term.toLowerCase() === sa.toLowerCase());
                return (
                  <React.Fragment key={sa}>
                    {idx > 0 && ', '}
                    {found ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTerm(found);
                          if (onNavigateTerm && found.id) onNavigateTerm(found.id);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {sa}
                      </button>
                    ) : (
                      <span>{sa}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}
    </span>
  );
};
