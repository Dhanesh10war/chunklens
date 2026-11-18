import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { ChunkingConfig } from '../../engine/types';
import { LearningCenterView } from './LearningCenterView';

export interface LearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConfig?: (config: ChunkingConfig) => void;
  defaultTab?: 'manual' | 'academy' | 'presets' | 'glossary';
}

export const LearningModal: React.FC<LearningModalProps> = ({
  isOpen,
  onClose,
  onApplyConfig,
  defaultTab = 'manual',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative bg-surface-1 surface-translucent border border-separator rounded-t-2xl sm:rounded-panel w-full max-w-4xl max-h-modal overflow-hidden shadow-modal flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-separator bg-surface-1/50 surface-translucent shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-control bg-accent-subtle border border-accent/30 text-accent">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 id="learning-modal-title" className="font-semibold text-text text-sm tracking-tight">
                User Manual &amp; RAG Academy
              </h3>
              <p className="text-xs text-text-secondary">
                Interactive feature guides, retrieval science, domain presets, and technical glossary.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-control text-text-secondary hover:text-text hover:bg-surface-2 active-press focus-ring transition-colors"
            aria-label="Close learning modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable Learning Center View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <LearningCenterView
            onApplyConfig={(config) => {
              if (onApplyConfig) {
                onApplyConfig(config);
              }
              onClose();
            }}
            defaultTab={defaultTab}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};
