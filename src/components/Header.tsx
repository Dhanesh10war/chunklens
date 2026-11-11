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
    <header className="border-b border-slate-800 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">ChunkLens</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                v0.1.0 • RAG Optimizer
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Visual Document Chunking & Token Workbench</p>
          </div>
        </div>

        {/* Center: Privacy Guarantee Pill */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>100% Client-Side • Zero Server Data Transmission</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleCompare}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
              isCompareMode
                ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                : 'bg-surface border-slate-800 text-slate-300 hover:border-slate-700'
            )}
          >
            <SplitSquareVertical className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
          </button>

          <button
            onClick={onExportClick}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20 hover:opacity-95 transition-opacity"
          >
            <Code2 className="h-4 w-4" />
            <span>Export Code</span>
          </button>

          <a
            href="https://github.com/Dhanesh10war/chunklens"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-surface border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
