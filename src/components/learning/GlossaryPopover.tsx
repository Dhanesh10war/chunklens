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
        className="learn-glossary-trigger underline decoration-dotted decoration-accent/50 font-medium text-accent hover:opacity-85 transition-colors cursor-help focus-ring rounded px-0.5"
        title={`Glossary definition: ${term.term}`}
      >
        {displayText}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Definition of ${term.term}`}
          className="learn-glossary-popover absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-surface-1 border border-separator rounded-xl shadow-xl text-left text-sm"
        >
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-separator">
            <div>
              <h4 className="font-semibold text-text leading-snug">
                {term.term}
              </h4>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium rounded bg-accent-subtle text-accent border border-accent/25">
                {term.category}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close definition"
              className="text-text-muted hover:text-text p-1 min-w-[24px] min-h-[24px] flex items-center justify-center rounded"
            >
              ✕
            </button>
          </div>

          <p className="text-text-secondary text-xs sm:text-sm leading-relaxed mb-2">
            {term.definition}
          </p>

          {term.formulaOrExample && (
            <div className="mt-2 p-2 bg-surface-2 rounded border border-separator font-mono text-xs text-text overflow-x-auto">
              {term.formulaOrExample}
            </div>
          )}

          {term.seeAlso && term.seeAlso.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-separator text-xs text-text-muted">
              <span className="font-medium text-text-secondary">See also: </span>
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
                        className="text-accent hover:underline"
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
