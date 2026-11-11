import React from 'react';
import { Layers, ShieldCheck, Github, Code2, SplitSquareVertical } from 'lucide-react';
import { cn } from '../utils/cn';

interface HeaderProps {
  onExportClick: () => void;
  isCompareMode: boolean;
  onToggleCompare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportClick,
  isCompareMode,
  onToggleCompare,
}) => {
  return (
    <header className="border-b border-border bg-panel sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand / Precision Aperture Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-md bg-surface border border-border flex items-center justify-center text-primary-400 shadow-subtle">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-white font-sans">ChunkLens</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-sm bg-subtle text-slate-300 border border-border-subtle">
                v0.1.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Visual RAG Chunking & Token Optimizer</p>
          </div>
        </div>

        {/* Center: Privacy Guarantee Pill */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>100% Client-Side • Zero Network Egress</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleCompare}
            className={cn(
              'h-8 flex items-center space-x-1.5 px-3 rounded-md text-xs font-medium border active-press focus-ring transition-colors',
              isCompareMode
                ? 'bg-primary-500/15 border-primary-500 text-primary-300 shadow-subtle'
                : 'bg-surface border-border text-slate-300 hover:bg-subtle hover:border-border-hover'
            )}
          >
            <SplitSquareVertical className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          <button
            onClick={onExportClick}
            className="h-8 flex items-center space-x-1.5 px-3 rounded-md text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white border border-primary-500 active-press focus-ring shadow-subtle transition-colors"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          <a
            href="https://github.com/Dhanesh10war/chunklens"
            target="_blank"
            rel="noreferrer"
            className="h-8 flex items-center space-x-1 px-2.5 rounded-md text-xs font-medium text-slate-300 bg-surface border border-border hover:bg-subtle hover:border-border-hover active-press focus-ring transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
