import React from 'react';
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
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-12 border-b border-border-default bg-surface sticky top-0 z-30 select-none">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left: Brand + Document Title + Reset */}
        <div className="flex items-center space-x-2.5 min-w-0">
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
            <span className="text-[10px] font-mono text-text-tertiary">v0.2.0</span>
          </div>

          <span className="text-border-default hidden sm:inline">/</span>

          {/* Document Name & Reset */}
          <div className="hidden sm:flex items-center space-x-1.5 min-w-0 max-w-[240px] md:max-w-xs">
            <span className="text-xs text-text-secondary truncate font-mono" title={documentTitle}>
              {documentTitle}
            </span>
            {detectedFormat && (
              <Tooltip content={`Format: ${detectedFormat.label} · Recommended: ${detectedFormat.recommendedStrategy}`}>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border border-border-default bg-elevated text-accent select-none shrink-0">
                  {detectedFormat.badge}
                </span>
              </Tooltip>
            )}
            <Tooltip content="Reset document & settings to defaults">
              <button
                onClick={onResetDocument}
                className="h-5 px-1.5 rounded text-[10px] text-text-tertiary hover:text-text-primary hover:bg-elevated flex items-center space-x-1 active-press focus-ring transition-colors"
                aria-label="Reset document"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Reset</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Center: Privacy Indicator & How to Verify Popover */}
        <div className="flex items-center">
          <PrivacyPopover />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Command Palette Trigger */}
          <Tooltip content="Open command palette" shortcut="⌘K">
            <button
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center space-x-1.5 h-7 px-2 rounded-md bg-elevated border border-border-default text-text-tertiary hover:text-text-primary hover:border-border-hover text-[11px] font-mono transition-colors active-press focus-ring"
              aria-label="Open command palette"
            >
              <span>Quick Actions</span>
              <kbd className="text-[10px] px-1 py-0.2 rounded bg-surface border border-border-subtle">
                ⌘K
              </kbd>
            </button>
          </Tooltip>

          {/* Tokenizers Comparison */}
          {onTokenizerClick && (
            <Tooltip content="Compare multi-model token variance and embedding costs">
              <Button
                variant="secondary"
                size="sm"
                icon={<Cpu className="h-3.5 w-3.5 text-text-secondary" />}
                onClick={onTokenizerClick}
                aria-label="Compare tokenizers and embedding costs"
              >
                <span className="hidden md:inline">Tokenizers</span>
              </Button>
            </Tooltip>
          )}

          {/* Compare Benchmark Mode */}
          <Tooltip content="Side-by-side benchmark comparison">
            <Button
              variant={isCompareMode ? 'secondary' : 'ghost'}
              size="sm"
              icon={<SplitSquareVertical className="h-3.5 w-3.5 text-text-secondary" />}
              onClick={onToggleCompare}
              aria-label="Toggle side-by-side comparison"
              className={isCompareMode ? 'border-accent text-text-primary bg-accent-subtle' : ''}
            >
              <span className="hidden md:inline">Compare</span>
            </Button>
          </Tooltip>

          {/* Single Solid Accent Primary Action: Export */}
          <Tooltip content="Export code implementation and chunk datasets" shortcut="⌘E">
            <Button
              variant="primary"
              size="sm"
              icon={<Code2 className="h-3.5 w-3.5" />}
              onClick={onExportClick}
              aria-label="Export code and chunks"
            >
              <span>Export</span>
            </Button>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <button
              onClick={toggleTheme}
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors active-press focus-ring"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>

          {/* GitHub Source Link */}
          <Tooltip content="GitHub repository">
            <a
              href="https://github.com/Dhanesh10war/chunklens"
              target="_blank"
              rel="noreferrer"
              className="h-7 w-7 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors active-press focus-ring"
              aria-label="View on GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};
