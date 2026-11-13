import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Layers,
  FileText,
  Sliders,
  Cpu,
  Download,
  Moon,
  Sun,
  RotateCcw,
  PanelLeft,
  PanelRight,
  SplitSquareVertical,
  Grid3X3,
  Edit3,
  Check,
  FilePlus,
} from 'lucide-react';
import { ChunkingStrategy } from '../engine/types';
import { SAMPLE_DOCUMENTS } from '../data/samples';
import { useTheme } from '../utils/theme';
import { cn } from '../utils/cn';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStrategy: (strategy: ChunkingStrategy) => void;
  currentStrategy: ChunkingStrategy;
  onSelectSample: (sampleId: string) => void;
  onNewDocument?: () => void;
  onResetDocument: () => void;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onOpenExport: () => void;
  onOpenTokenizer: () => void;
  onSelectTab: (tab: 'visualizer' | 'heatmap' | 'editor') => void;
  onToggleCompare: () => void;
}

interface CommandItem {
  id: string;
  category: 'Strategies' | 'Documents' | 'Views' | 'Panels & Settings';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  active?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectStrategy,
  currentStrategy,
  onSelectSample,
  onNewDocument,
  onResetDocument,
  onToggleSidebar,
  onToggleInspector,
  onOpenExport,
  onOpenTokenizer,
  onSelectTab,
  onToggleCompare,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered from parent or toggled
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commands: CommandItem[] = [
    // Strategies
    {
      id: 'strat-recursive',
      category: 'Strategies',
      title: 'Recursive Character Splitting',
      subtitle: 'Hierarchical boundary recursion for RAG',
      icon: <Sliders className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('recursive');
        onClose();
      },
      active: currentStrategy === 'recursive',
    },
    {
      id: 'strat-fixed',
      category: 'Strategies',
      title: 'Fixed-Size Sliding Window',
      subtitle: 'Strict token/char window with overlap',
      icon: <Sliders className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('fixed');
        onClose();
      },
      active: currentStrategy === 'fixed',
    },
    {
      id: 'strat-sentence',
      category: 'Strategies',
      title: 'Sentence-Based Splitting',
      subtitle: 'Preserves grammatical sentence boundaries',
      icon: <Sliders className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('sentence');
        onClose();
      },
      active: currentStrategy === 'sentence',
    },
    {
      id: 'strat-markdown',
      category: 'Strategies',
      title: 'Markdown Header Splitting',
      subtitle: 'H1–H6 section hierarchy with metadata context',
      icon: <Sliders className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('markdown');
        onClose();
      },
      active: currentStrategy === 'markdown',
    },
    {
      id: 'strat-tabular',
      category: 'Strategies',
      title: 'Tabular CSV / JSON Record Chunking',
      subtitle: 'Schema-preserving records for structured datasets',
      icon: <Sliders className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('tabular');
        onClose();
      },
      active: currentStrategy === 'tabular',
    },

    // Documents
    ...(onNewDocument
      ? [
          {
            id: 'doc-new',
            category: 'Documents' as const,
            title: 'New Document (Clear Canvas)',
            subtitle: 'Clear current document and open the file dropzone & sample picker',
            icon: <FilePlus className="h-4 w-4" />,
            action: () => {
              onNewDocument();
              onClose();
            },
          },
        ]
      : []),
    ...SAMPLE_DOCUMENTS.map((doc) => ({
      id: `doc-${doc.id}`,
      category: 'Documents' as const,
      title: `Load: ${doc.title}`,
      subtitle: `${doc.category} — ${doc.description}`,
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        onSelectSample(doc.id);
        onClose();
      },
    })),
    {
      id: 'doc-reset',
      category: 'Documents',
      title: 'Reset Document to Defaults',
      subtitle: 'Restore default sample text and configuration',
      icon: <RotateCcw className="h-4 w-4" />,
      action: () => {
        onResetDocument();
        onClose();
      },
    },

    // Views
    {
      id: 'view-chunks',
      category: 'Views',
      title: 'View Continuous Chunks Canvas',
      icon: <Layers className="h-4 w-4" />,
      action: () => {
        onSelectTab('visualizer');
        onClose();
      },
    },
    {
      id: 'view-heatmap',
      category: 'Views',
      title: 'View Cosine Similarity Heatmap',
      subtitle: 'TF-IDF chunk-to-chunk correlation matrix',
      icon: <Grid3X3 className="h-4 w-4" />,
      action: () => {
        onSelectTab('heatmap');
        onClose();
      },
    },
    {
      id: 'view-editor',
      category: 'Views',
      title: 'Edit Raw Document Text',
      icon: <Edit3 className="h-4 w-4" />,
      action: () => {
        onSelectTab('editor');
        onClose();
      },
    },
    {
      id: 'view-compare',
      category: 'Views',
      title: 'Toggle A/B Comparison Mode',
      subtitle: 'Compare two chunking parameter configurations side-by-side',
      icon: <SplitSquareVertical className="h-4 w-4" />,
      action: () => {
        onToggleCompare();
        onClose();
      },
    },

    // Panels & Settings
    {
      id: 'panel-sidebar',
      category: 'Panels & Settings',
      title: 'Toggle Left Sidebar',
      shortcut: '[',
      icon: <PanelLeft className="h-4 w-4" />,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    },
    {
      id: 'panel-inspector',
      category: 'Panels & Settings',
      title: 'Toggle Chunk Inspector',
      shortcut: ']',
      icon: <PanelRight className="h-4 w-4" />,
      action: () => {
        onToggleInspector();
        onClose();
      },
    },
    {
      id: 'panel-theme',
      category: 'Panels & Settings',
      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      icon: isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'action-export',
      category: 'Panels & Settings',
      title: 'Export Code & Chunks Dataset',
      subtitle: 'Python, TypeScript, and JSON artifacts',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        onOpenExport();
        onClose();
      },
    },
    {
      id: 'action-tokenizers',
      category: 'Panels & Settings',
      title: 'Open Multi-Model Tokenizer Matrix',
      subtitle: 'Compare token counts and embedding costs across LLMs',
      icon: <Cpu className="h-4 w-4" />,
      action: () => {
        onOpenTokenizer();
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl bg-surface border border-border-default shadow-elevated overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-12 px-4 border-b border-border-default flex items-center space-x-3 bg-surface">
          <Search className="h-4 w-4 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search actions..."
            className="flex-1 bg-transparent border-0 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
            aria-label="Command search"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-elevated border border-border-default text-text-tertiary">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-border-subtle">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-tertiary">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors',
                    isSelected
                      ? 'bg-elevated text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className={cn('shrink-0', isSelected ? 'text-accent' : 'text-text-tertiary')}>
                      {cmd.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium truncate">{cmd.title}</span>
                        {cmd.active && (
                          <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                        )}
                      </div>
                      {cmd.subtitle && (
                        <span className="text-[11px] text-text-tertiary truncate">
                          {cmd.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-default text-text-tertiary">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="h-8 px-4 border-t border-border-default bg-elevated flex items-center justify-between text-[11px] font-mono text-text-tertiary select-none">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="hidden sm:inline">Shortcuts: [ ] J K C</span>
        </div>
      </div>
    </div>
  );
};
