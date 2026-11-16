import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Github,
  Code2,
  SplitSquareVertical,
  Cpu,
  RotateCcw,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Command,
  Grid3X3,
  Edit3,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { SegmentedControl } from './ui/SegmentedControl';
import { PrivacyPopover } from './PrivacyPopover';
import { useTheme } from '../utils/theme';
import { DetectedFormatInfo } from '../utils/fileFormatDetector';
import { cn } from '../utils/cn';

interface HeaderProps {
  documentTitle: string;
  detectedFormat?: DetectedFormatInfo | null;
  onResetDocument: () => void;
  onExportClick: () => void;
  onTokenizerClick?: () => void;
  isCompareMode: boolean;
  onToggleCompare: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenCommandPalette?: () => void;
  onPrefetchExport?: () => void;
  onPrefetchCommandPalette?: () => void;
  onPrefetchTokenizer?: () => void;
  activeTab?: 'visualizer' | 'heatmap' | 'editor';
  onChangeTab?: (tab: 'visualizer' | 'heatmap' | 'editor') => void;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  detectedFormat,
  onResetDocument,
  onExportClick,
  onTokenizerClick,
  isCompareMode,
  onToggleCompare,
  isSidebarOpen,
  onToggleSidebar,
  onOpenCommandPalette,
  onPrefetchExport,
  onPrefetchCommandPalette,
  onPrefetchTokenizer,
  activeTab,
  onChangeTab,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!isOverflowOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        overflowTriggerRef.current &&
        !overflowTriggerRef.current.contains(e.target as Node)
      ) {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOverflowOpen]);

  // Focus management and keyboard navigation for overflow menu
  const closeMenuAndReturnFocus = () => {
    setIsOverflowOpen(false);
    overflowTriggerRef.current?.focus();
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOverflowOpen || !menuRef.current) return;

    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('[role="menuitem"]')
    );
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement | HTMLAnchorElement);

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenuAndReturnFocus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  useEffect(() => {
    if (isOverflowOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLButtonElement | HTMLAnchorElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [isOverflowOpen]);

  return (
    <header className="h-[52px] border-b border-separator surface-translucent sticky top-0 z-30 select-none flex items-center px-3 sm:px-4">
      <div className="w-full flex items-center justify-between gap-2 lg:gap-3 min-w-0">
        {/* Left Cluster: Sidebar Toggle, Brand + Version, Document Title & Reset */}
        <div className="flex items-center space-x-2 shrink-0 sm:min-w-0">
          <Tooltip content={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} shortcut="[">
            <button
              onClick={onToggleSidebar}
              className="h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring shrink-0"
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          </Tooltip>

          {/* App Brand + Version */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="h-6 w-6 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-accent shrink-0">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <h1 className="font-semibold text-sm tracking-tight text-text m-0 p-0 inline">ChunkLens</h1>
            <span className="text-xs font-mono text-text-secondary mr-2 sm:mr-0">{`v${__APP_VERSION__}`}</span>
          </div>

          <span className="text-separator hidden sm:inline" aria-hidden="true">/</span>

          {/* Document Name & Reset */}
          <div className="hidden sm:flex items-center space-x-1.5 min-w-0 max-w-[130px] md:max-w-[180px] min-[1400px]:max-w-[240px]">
            <span
              className="text-xs text-text-secondary truncate font-mono"
              title={documentTitle || 'No document loaded'}
            >
              {documentTitle || <span className="text-text-tertiary italic">No document</span>}
            </span>
            {detectedFormat && (
              <Tooltip content={`Format: ${detectedFormat.label} · Recommended: ${detectedFormat.recommendedStrategy}`}>
                <span className="px-1.5 py-0.5 rounded-control text-xs font-mono font-medium border border-separator bg-surface-2 text-text select-none shrink-0">
                  {detectedFormat.badge}
                </span>
              </Tooltip>
            )}
            <Tooltip content="Reset document & settings to defaults">
              <button
                onClick={onResetDocument}
                className="h-6 px-1.5 rounded-control text-xs text-text-tertiary hover:text-text hover:bg-surface-2 flex items-center space-x-1 active-press focus-ring transition-colors shrink-0"
                aria-label="Reset document"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Center: Segmented Control Tabs */}
        {activeTab && onChangeTab && (
          <div className="hidden md:flex items-center justify-center shrink-0">
            <SegmentedControl
              variant="subtle"
              size="sm"
              options={[
                { value: 'visualizer', label: 'Chunks', icon: <Layers className="h-3.5 w-3.5" /> },
                {
                  value: 'heatmap',
                  label: (
                    <span>
                      <span className="hidden min-[1400px]:inline">Similarity </span>Heatmap
                    </span>
                  ),
                  icon: <Grid3X3 className="h-3.5 w-3.5" />,
                },
                {
                  value: 'editor',
                  label: (
                    <span>
                      <span className="hidden min-[1400px]:inline">Edit Raw </span>Text
                    </span>
                  ),
                  icon: <Edit3 className="h-3.5 w-3.5" />,
                },
              ]}
              value={activeTab}
              onChange={(val) => onChangeTab(val as 'visualizer' | 'heatmap' | 'editor')}
              ariaLabel="Main document view selector"
            />
          </div>
        )}

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {/* Privacy Popover Trigger: Quiet Success Pill */}
          <PrivacyPopover />

          {/* Quick Actions (Command Palette Search-style Pill) */}
          {onOpenCommandPalette && (
            <Tooltip content="Open command palette" shortcut="⌘K" wrapperClassName="hidden xl:inline-flex">
              <button
                onClick={onOpenCommandPalette}
                onMouseEnter={onPrefetchCommandPalette}
                onFocus={onPrefetchCommandPalette}
                className="flex items-center space-x-1.5 h-8 px-2.5 rounded-control bg-surface-2 border border-separator text-text-secondary hover:text-text hover:bg-surface-3 text-xs font-mono transition-colors active-press focus-ring"
                aria-label="Open command palette"
              >
                <Command className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                <span className="hidden min-[1400px]:inline">Quick Actions</span>
                <kbd className="text-2xs px-1 py-0.5 rounded bg-surface-1 dark:bg-surface-3 border border-separator text-text-secondary">
                  ⌘K
                </kbd>
              </button>
            </Tooltip>
          )}

          {/* Tokenizers Comparison: Icon-only at <1400px, Full above */}
          {onTokenizerClick && (
            <Tooltip content="Compare multi-model token variance and embedding costs" wrapperClassName="hidden md:inline-flex">
              <button
                onClick={onTokenizerClick}
                onMouseEnter={onPrefetchTokenizer}
                onFocus={onPrefetchTokenizer}
                className="h-8 px-2.5 rounded-control bg-transparent hover:bg-surface-2 text-text-secondary hover:text-text border border-transparent flex items-center space-x-1.5 text-xs font-medium transition-colors active-press focus-ring"
                aria-label="Compare tokenizers and embedding costs"
              >
                <Cpu className="h-3.5 w-3.5" />
                <span className="hidden min-[1400px]:inline">Tokenizers</span>
              </button>
            </Tooltip>
          )}

          {/* Compare Benchmark Mode: Icon-only at <1400px */}
          <Tooltip content="Side-by-side benchmark comparison" wrapperClassName="hidden md:inline-flex">
            <button
              onClick={onToggleCompare}
              className={cn(
                'h-8 px-2.5 rounded-control border flex items-center space-x-1.5 text-xs font-medium transition-colors active-press focus-ring',
                isCompareMode
                  ? 'bg-accent-subtle border-accent/30 text-accent'
                  : 'bg-transparent border-transparent hover:bg-surface-2 text-text-secondary hover:text-text'
              )}
              aria-label="Toggle side-by-side comparison"
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span className="hidden min-[1400px]:inline">Compare</span>
            </button>
          </Tooltip>

          {/* Single Solid Accent Primary Action: Export - Always Visible */}
          <Tooltip content="Export code implementation and chunk datasets" shortcut="⌘E">
            <Button
              variant="primary"
              size="sm"
              icon={<Code2 className="h-3.5 w-3.5" />}
              onClick={onExportClick}
              onMouseEnter={onPrefetchExport}
              onFocus={onPrefetchExport}
              aria-label="Export code and chunks"
              className="h-8 px-3 rounded-control text-xs font-medium"
            >
              <span>Export</span>
            </Button>
          </Tooltip>

          {/* Theme Toggle: Kept visible at >= 768px (Amendment E) */}
          <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'} wrapperClassName="hidden md:flex">
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>

          {/* GitHub Source Link */}
          <Tooltip content="GitHub repository" wrapperClassName="hidden min-[1400px]:inline-flex">
            <a
              href="https://github.com/Dhanesh10war/chunklens"
              target="_blank"
              rel="noreferrer"
              className="h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring"
              aria-label="View on GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </Tooltip>

          {/* Overflow Menu Trigger: Visible when viewport is < 1400px */}
          <div className="relative min-[1400px]:hidden">
            <Tooltip content="More actions">
              <button
                ref={overflowTriggerRef}
                onClick={() => setIsOverflowOpen((prev) => !prev)}
                aria-label="More actions"
                aria-haspopup="menu"
                aria-expanded={isOverflowOpen}
                className={cn(
                  'h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring',
                  isOverflowOpen && 'bg-surface-2 text-text'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </Tooltip>

            {/* Overflow Dropdown Menu with Arrow Navigation & Focus Return */}
            {isOverflowOpen && (
              <div
                ref={menuRef}
                role="menu"
                aria-label="More actions menu"
                onKeyDown={handleMenuKeyDown}
                className="absolute right-0 top-full mt-1.5 w-56 rounded-card surface-translucent border border-separator shadow-modal py-1 z-50 focus:outline-none"
              >
                {/* Compare Mode (at <768px) */}
                <button
                  role="menuitem"
                  onClick={() => {
                    onToggleCompare();
                    closeMenuAndReturnFocus();
                  }}
                  className="md:hidden w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text hover:bg-surface-2 flex items-center justify-between transition-colors focus:bg-surface-2 focus:outline-none"
                >
                  <span className="flex items-center space-x-2">
                    <SplitSquareVertical className="h-3.5 w-3.5 text-accent" />
                    <span>Compare Benchmark</span>
                  </span>
                  {isCompareMode && <span className="text-2xs text-accent font-medium">Active</span>}
                </button>

                {/* Tokenizers Comparison */}
                {onTokenizerClick && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      onTokenizerClick();
                      closeMenuAndReturnFocus();
                    }}
                    onMouseEnter={onPrefetchTokenizer}
                    className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text hover:bg-surface-2 flex items-center space-x-2 transition-colors focus:bg-surface-2 focus:outline-none"
                  >
                    <Cpu className="h-3.5 w-3.5 text-accent" />
                    <span>Compare Tokenizers</span>
                  </button>
                )}

                {/* Quick Actions / Command Palette */}
                {onOpenCommandPalette && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      onOpenCommandPalette();
                      closeMenuAndReturnFocus();
                    }}
                    onMouseEnter={onPrefetchCommandPalette}
                    className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text hover:bg-surface-2 flex items-center justify-between transition-colors focus:bg-surface-2 focus:outline-none"
                  >
                    <span className="flex items-center space-x-2">
                      <Command className="h-3.5 w-3.5 text-text-tertiary" />
                      <span>Quick Actions</span>
                    </span>
                    <kbd className="text-2xs px-1 py-0.5 rounded bg-surface-1 dark:bg-surface-3 border border-separator font-mono text-text-secondary">
                      ⌘K
                    </kbd>
                  </button>
                )}

                {/* Theme Toggle (at <768px) */}
                <button
                  role="menuitem"
                  onClick={() => {
                    toggleTheme();
                    closeMenuAndReturnFocus();
                  }}
                  className="md:hidden w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text hover:bg-surface-2 flex items-center space-x-2 transition-colors focus:bg-surface-2 focus:outline-none"
                >
                  {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
                  <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>

                {/* Reset document (at <640px when hidden from left) */}
                <button
                  role="menuitem"
                  onClick={() => {
                    onResetDocument();
                    closeMenuAndReturnFocus();
                  }}
                  className="sm:hidden w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text hover:bg-surface-2 flex items-center space-x-2 transition-colors focus:bg-surface-2 focus:outline-none"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-status-warn" />
                  <span>Reset to defaults</span>
                </button>

                <div className="my-1 border-t border-separator" />

                {/* GitHub link */}
                <a
                  role="menuitem"
                  href="https://github.com/Dhanesh10war/chunklens"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => closeMenuAndReturnFocus()}
                  className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text hover:bg-surface-2 flex items-center space-x-2 transition-colors focus:bg-surface-2 focus:outline-none"
                >
                  <Github className="h-3.5 w-3.5 text-text-tertiary" />
                  <span>GitHub Repository</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
