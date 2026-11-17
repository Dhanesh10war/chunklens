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
  Trash2,
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
  onClearSavedData?: () => void;
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
  onClearSavedData,
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
      title: 'Recursive Character Splitter',
      subtitle: 'Recursively uses linebreaks and spaces for natural semantic boundaries',
      icon: <Layers className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('recursive');
        onClose();
      },
      active: currentStrategy === 'recursive',
    },
    {
      id: 'strat-fixed',
      category: 'Strategies',
      title: 'Fixed Size with Overlap',
      subtitle: 'Strict token or character windowing with sliding overlap',
      icon: <Sliders className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('fixed');
        onClose();
      },
      active: currentStrategy === 'fixed',
    },
    {
      id: 'strat-markdown',
      category: 'Strategies',
      title: 'Markdown Header Splitter',
      subtitle: 'Splits hierarchically along Markdown headers (# H1, ## H2)',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('markdown');
        onClose();
      },
      active: currentStrategy === 'markdown',
    },
    {
      id: 'strat-sentence',
      category: 'Strategies',
      title: 'Sentence / Paragraph Aware',
      subtitle: 'Preserves sentences (. ! ?) and whole paragraphs intact',
      icon: <SplitSquareVertical className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('sentence');
        onClose();
      },
      active: currentStrategy === 'sentence',
    },
    {
      id: 'strat-tabular',
      category: 'Strategies',
      title: 'Tabular CSV & JSON Records',
      subtitle: 'Preserves columns and emits row chunks with headers',
      icon: <Grid3X3 className="h-4 w-4" />,
      action: () => {
        onSelectStrategy('tabular');
        onClose();
      },
      active: currentStrategy === 'tabular',
    },

    // Sample Documents
    ...SAMPLE_DOCUMENTS.map((sample): CommandItem => ({
      id: `doc-${sample.id}`,
      category: 'Documents',
      title: `Load ${sample.title}`,
      subtitle: sample.category,
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        onSelectSample(sample.id);
        onClose();
      },
    })),

    ...(onNewDocument
      ? [
          {
            id: 'doc-new',
            category: 'Documents' as const,
            title: 'New Document (Clear canvas & paste/upload)',
            subtitle: 'Resets active text and opens the dropzone',
            icon: <FilePlus className="h-4 w-4" />,
            action: () => {
              onNewDocument();
              onClose();
            },
          },
        ]
      : []),

    {
      id: 'doc-reset-defaults',
      category: 'Documents',
      title: 'Reset to Default Document & Configuration',
      subtitle: 'Restores sample state and default chunking parameters',
      icon: <RotateCcw className="h-4 w-4" />,
      action: () => {
        onResetDocument();
        onClose();
      },
    },

    // Views
    {
      id: 'view-visualizer',
      category: 'Views',
      title: 'Switch to Chunks Visualizer',
      subtitle: 'Continuous stream or separated card views',
      shortcut: '1',
      icon: <Layers className="h-4 w-4" />,
      action: () => {
        onSelectTab('visualizer');
        onClose();
      },
    },
    {
      id: 'view-heatmap',
      category: 'Views',
      title: 'Switch to Similarity Heatmap',
      subtitle: 'N x N semantic similarity matrix and boundary continuity',
      shortcut: '2',
      icon: <Grid3X3 className="h-4 w-4" />,
      action: () => {
        onSelectTab('heatmap');
        onClose();
      },
    },
    {
      id: 'view-editor',
      category: 'Views',
      title: 'Switch to Raw Document Editor',
      subtitle: 'Edit source document text directly',
      shortcut: '3',
      icon: <Edit3 className="h-4 w-4" />,
      action: () => {
        onSelectTab('editor');
        onClose();
      },
    },

    // Panels & Settings
    {
      id: 'panel-toggle-sidebar',
      category: 'Panels & Settings',
      title: 'Toggle Left Sidebar',
      subtitle: 'Collapse or expand parameter controls',
      shortcut: '[',
      icon: <PanelLeft className="h-4 w-4" />,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    },
    {
      id: 'panel-toggle-inspector',
      category: 'Panels & Settings',
      title: 'Toggle Right Inspector',
      subtitle: 'Inspect selected chunk token & boundary diagnostics',
      shortcut: ']',
      icon: <PanelRight className="h-4 w-4" />,
      action: () => {
        onToggleInspector();
        onClose();
      },
    },
    {
      id: 'action-toggle-compare',
      category: 'Panels & Settings',
      title: 'Toggle A/B Strategy Compare Mode',
      subtitle: 'Side-by-side splitter comparison',
      icon: <SplitSquareVertical className="h-4 w-4" />,
      action: () => {
        onToggleCompare();
        onClose();
      },
    },
    {
      id: 'setting-toggle-theme',
      category: 'Panels & Settings',
      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: 'Theme Appearance',
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
    {
      id: 'action-clear-saved-data',
      category: 'Panels & Settings',
      title: 'Clear Saved Data',
      subtitle: 'Purge document and session settings from localStorage',
      icon: <Trash2 className="h-4 w-4 text-status-error" />,
      action: () => {
        onClearSavedData?.();
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-panel bg-surface-1 surface-translucent border border-separator shadow-modal overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-12 px-4 border-b border-separator flex items-center space-x-3 bg-surface-1/50 surface-translucent">
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
            className="flex-1 bg-transparent border-0 text-xs text-text placeholder:text-text-tertiary focus:outline-none font-sans"
            aria-label="Command search"
          />
          <kbd className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-separator text-text-secondary">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-separator/40">
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
                    'flex items-center justify-between px-3 py-2 rounded-control cursor-pointer text-xs transition-colors border',
                    isSelected
                      ? 'bg-accent-subtle text-text border-accent/25'
                      : 'text-text-secondary hover:text-text hover:bg-surface-2 border-transparent'
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
                        <span className="text-2xs text-text-tertiary truncate">
                          {cmd.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-1 dark:bg-surface-3 border border-separator text-text-secondary">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="h-8 px-4 border-t border-separator bg-surface-2/60 flex items-center justify-between text-2xs font-mono text-text-tertiary select-none">
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
