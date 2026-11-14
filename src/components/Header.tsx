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
} from 'lucide-react';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { PrivacyPopover } from './PrivacyPopover';
import { useTheme } from '../utils/theme';
import { DetectedFormatInfo } from '../utils/fileFormatDetector';

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

  // Focus management and arrow key navigation for overflow menu
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

  // Focus first item when opening
  useEffect(() => {
    if (isOverflowOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLButtonElement | HTMLAnchorElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [isOverflowOpen]);

  return (
    <header className="h-12 border-b border-border-default bg-surface sticky top-0 z-30 select-none">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand + Document Title + Reset */}
        <div className="flex items-center space-x-2 shrink-0 sm:min-w-0">
          <Tooltip content={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} shortcut="[">
            <button
              onClick={onToggleSidebar}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors active-press focus-ring"
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          </Tooltip>

          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="h-6 w-6 rounded bg-elevated border border-border-default flex items-center justify-center text-accent">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-text-primary">ChunkLens</span>
            <span className="text-xs font-mono text-text-tertiary mr-2 sm:mr-0">v0.2.0</span>
          </div>

          <span className="text-border-default hidden sm:inline">/</span>

          {/* Document Name & Reset */}
          <div className="hidden sm:flex items-center space-x-1.5 min-w-0 max-w-[140px] md:max-w-[200px] lg:max-w-xs">
            <span
              className="text-xs text-text-secondary truncate font-mono"
              title={documentTitle || 'No document loaded'}
            >
              {documentTitle || <span className="text-text-tertiary italic">No document</span>}
            </span>
            {detectedFormat && (
              <Tooltip content={`Format: ${detectedFormat.label} · Recommended: ${detectedFormat.recommendedStrategy}`}>
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-border-default bg-elevated text-accent select-none shrink-0">
                  {detectedFormat.badge}
                </span>
              </Tooltip>
            )}
            <Tooltip content="Reset document & settings to defaults">
              <button
                onClick={onResetDocument}
                className="h-5 px-1.5 rounded text-xs text-text-tertiary hover:text-text-primary hover:bg-elevated flex items-center space-x-1 active-press focus-ring transition-colors"
                aria-label="Reset document"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Center: Privacy Indicator & How to Verify Popover */}
        <div className="flex items-center shrink-0 ml-2.5 sm:ml-0">
          <PrivacyPopover />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 shrink-0 relative">
          {/* Quick Actions (Command Palette Trigger) - Visible at >= 1200px */}
          {onOpenCommandPalette && (
            <Tooltip content="Open command palette" shortcut="⌘K">
              <button
                onClick={onOpenCommandPalette}
                onMouseEnter={onPrefetchCommandPalette}
                onFocus={onPrefetchCommandPalette}
                className="hidden xl:flex items-center space-x-1.5 h-7 px-2 rounded-md bg-elevated border border-border-default text-text-tertiary hover:text-text-primary hover:border-border-hover text-xs font-mono transition-colors active-press focus-ring"
                aria-label="Open command palette"
              >
                <span>Quick Actions</span>
                <kbd className="text-xs px-1 py-0.5 rounded bg-surface border border-border-subtle">
                  ⌘K
                </kbd>
              </button>
            </Tooltip>
          )}

          {/* Tokenizers Comparison - Visible at >= 1200px */}
          {onTokenizerClick && (
            <Tooltip content="Compare multi-model token variance and embedding costs">
              <Button
                variant="secondary"
                size="sm"
                icon={<Cpu className="h-3.5 w-3.5 text-text-secondary" />}
                onClick={onTokenizerClick}
                onMouseEnter={onPrefetchTokenizer}
                onFocus={onPrefetchTokenizer}
                aria-label="Compare tokenizers and embedding costs"
                className="hidden xl:inline-flex"
              >
                <span>Tokenizers</span>
              </Button>
            </Tooltip>
          )}

          {/* Compare Benchmark Mode - Visible at >= 768px */}
          <Tooltip content="Side-by-side benchmark comparison">
            <Button
              variant={isCompareMode ? 'secondary' : 'ghost'}
              size="sm"
              icon={<SplitSquareVertical className="h-3.5 w-3.5 text-text-secondary" />}
              onClick={onToggleCompare}
              aria-label="Toggle side-by-side comparison"
              className={`hidden md:inline-flex ${isCompareMode ? 'border-accent text-text-primary bg-accent-subtle' : ''}`}
            >
              <span className="hidden lg:inline">Compare</span>
            </Button>
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
            >
              <span>Export</span>
            </Button>
          </Tooltip>

          {/* Theme Toggle: Kept visible at >= 768px (Amendment E) */}
          <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <button
              onClick={toggleTheme}
              className="hidden md:flex h-7 w-7 rounded-md items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors active-press focus-ring"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>

          {/* GitHub Source Link - Visible at >= 1200px */}
          <Tooltip content="GitHub repository">
            <a
              href="https://github.com/Dhanesh10war/chunklens"
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex h-7 w-7 rounded-md items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors active-press focus-ring"
              aria-label="View on GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </Tooltip>

          {/* Overflow Menu Trigger: Visible when viewport is < 1200px */}
          <div className="relative xl:hidden">
            <Tooltip content="More actions">
              <button
                ref={overflowTriggerRef}
                onClick={() => setIsOverflowOpen((prev) => !prev)}
                aria-label="More actions"
                aria-haspopup="menu"
                aria-expanded={isOverflowOpen}
                className={`h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors active-press focus-ring ${
                  isOverflowOpen ? 'bg-elevated text-text-primary' : ''
                }`}
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
                className="absolute right-0 top-full mt-1.5 w-56 rounded-md bg-surface border border-border-default shadow-elevated py-1 z-50 focus:outline-none"
              >
                {/* Compare Mode (at <768px) */}
                <button
                  role="menuitem"
                  onClick={() => {
                    onToggleCompare();
                    closeMenuAndReturnFocus();
                  }}
                  className="md:hidden w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-elevated flex items-center justify-between transition-colors focus:bg-elevated focus:outline-none"
                >
                  <span className="flex items-center space-x-2">
                    <SplitSquareVertical className="h-3.5 w-3.5 text-accent" />
                    <span>Compare Benchmark</span>
                  </span>
                  {isCompareMode && <span className="text-xs text-accent font-medium">Active</span>}
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
                    className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-elevated flex items-center space-x-2 transition-colors focus:bg-elevated focus:outline-none"
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
                    className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-elevated flex items-center justify-between transition-colors focus:bg-elevated focus:outline-none"
                  >
                    <span className="flex items-center space-x-2">
                      <Command className="h-3.5 w-3.5 text-text-tertiary" />
                      <span>Quick Actions</span>
                    </span>
                    <kbd className="text-xs px-1 py-0.5 rounded bg-surface border border-border-subtle font-mono text-text-tertiary">
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
                  className="md:hidden w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-elevated flex items-center space-x-2 transition-colors focus:bg-elevated focus:outline-none"
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
                  className="sm:hidden w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-elevated flex items-center space-x-2 transition-colors focus:bg-elevated focus:outline-none"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-status-warn" />
                  <span>Reset to defaults</span>
                </button>

                <div className="my-1 border-t border-border-subtle" />

                {/* GitHub link */}
                <a
                  role="menuitem"
                  href="https://github.com/Dhanesh10war/chunklens"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => closeMenuAndReturnFocus()}
                  className="w-full px-3 py-1.5 text-left text-xs text-text-secondary hover:text-text-primary hover:bg-elevated flex items-center space-x-2 transition-colors focus:bg-elevated focus:outline-none"
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
