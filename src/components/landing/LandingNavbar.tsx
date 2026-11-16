import React, { useState } from 'react';
import {
  Layers,
  Sun,
  Moon,
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Cpu,
  BookOpen,
  Briefcase,
  Home,
} from 'lucide-react';
import { useTheme } from '../../utils/theme';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export type LandingPageTab = 'overview' | 'features' | 'use-cases' | 'security' | 'docs';

interface LandingNavbarProps {
  activeTab: LandingPageTab;
  onSelectTab: (tab: LandingPageTab) => void;
  onLaunchApp: (sampleId?: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  activeTab,
  onSelectTab,
  onLaunchApp,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: LandingPageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Home className="h-3.5 w-3.5" /> },
    { id: 'features', label: 'Features & Engine', icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: 'use-cases', label: 'Use Cases', icon: <Briefcase className="h-3.5 w-3.5" /> },
    { id: 'security', label: 'Zero-Egress Security', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { id: 'docs', label: 'Docs & API', icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];

  const handleTabClick = (tab: LandingPageTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 surface-translucent border-b border-separator select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <button
          type="button"
          onClick={() => handleTabClick('overview')}
          className="flex items-center space-x-2.5 shrink-0 focus-ring rounded-control text-left"
          aria-label="ChunkLens Home Overview"
        >
          <div className="h-7 w-7 rounded-control bg-surface-2 border border-separator flex items-center justify-center text-accent shrink-0 shadow-subtle">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-text">ChunkLens</span>
          <span className="text-2xs font-mono text-text-tertiary px-1.5 py-0.5 rounded-control bg-surface-2 border border-separator hidden sm:inline">
            v0.3.0
          </span>
        </button>

        {/* Nav Links (Desktop) */}
        <nav
          aria-label="Main landing navigation"
          className="hidden md:flex items-center space-x-1 text-xs"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'px-3 py-1.5 rounded-control font-medium transition-colors flex items-center space-x-1.5 focus-ring',
                  isActive
                    ? 'bg-surface-2 text-text border border-separator/80 shadow-subtle'
                    : 'text-text-secondary hover:text-text hover:bg-surface-1'
                )}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 transition-colors active-press focus-ring"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Launch App Primary CTA */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onLaunchApp()}
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            className="text-xs font-semibold shadow-card hidden sm:inline-flex"
          >
            <span>Launch Visualizer</span>
          </Button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-8 w-8 rounded-control flex items-center justify-center text-text-secondary hover:text-text hover:bg-surface-2 focus-ring"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-separator bg-surface-1 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  'w-full px-3 py-2 rounded-control text-xs font-medium text-left flex items-center space-x-2.5 transition-colors focus-ring',
                  isActive
                    ? 'bg-accent-subtle text-accent font-semibold'
                    : 'text-text-secondary hover:text-text hover:bg-surface-2'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-separator">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onLaunchApp()}
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              className="w-full text-xs font-semibold justify-center"
            >
              <span>Launch Visualizer</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
