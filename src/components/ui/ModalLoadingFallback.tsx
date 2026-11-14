import React from 'react';
import { Loader2 } from 'lucide-react';

interface ModalLoadingFallbackProps {
  label?: string;
}

export const ModalLoadingFallback: React.FC<ModalLoadingFallbackProps> = ({
  label = 'Loading dialog...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-75"
    >
      <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-lg bg-surface border border-border-default shadow-modal text-xs font-sans text-text-primary">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>{label}</span>
      </div>
    </div>
  );
};
