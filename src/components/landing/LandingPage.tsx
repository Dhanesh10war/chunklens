import React, { useState, useEffect, Suspense } from 'react';
import { ChunkLensLogo } from '../ui/ChunkLensLogo';
import { LandingNavbar, LandingPageTab } from './LandingNavbar';
import { LandingOverview } from './LandingOverview';
import { LandingFeatures } from './LandingFeatures';
import { LandingUseCases } from './LandingUseCases';
import { LandingSecurity } from './LandingSecurity';
import { LandingDocs } from './LandingDocs';
import { ChunkingConfig } from '../../engine/types';

const ProWaitlistModal = React.lazy(() =>
  import('../pro/ProWaitlistModal').then((m) => ({ default: m.ProWaitlistModal }))
);

interface LandingPageProps {
  onLaunchApp: (sampleId?: string, config?: ChunkingConfig) => void;
  onOpenLearnTrack?: (slug?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, onOpenLearnTrack }) => {
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LandingPageTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'features', 'use-cases', 'security', 'docs'].includes(hash)) {
        return hash as LandingPageTab;
      }
    }
    return 'overview';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'features', 'use-cases', 'security', 'docs'].includes(hash)) {
        setActiveTab(hash as LandingPageTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  const handleSelectTab = (tab: LandingPageTab) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const url = new URL(window.location.href);
      if (tab === 'overview') {
        url.hash = '';
      } else {
        url.hash = tab;
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans antialiased selection:bg-accent/20 selection:text-text flex flex-col">
      {/* 1. Global Multi-page Navbar */}
      <LandingNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLaunchApp={onLaunchApp}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* 2. Main Page Content (Switching based on activeTab) */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <LandingOverview
            onLaunchApp={onLaunchApp}
            onNavigatePage={(page) => handleSelectTab(page as LandingPageTab)}
          />
        )}
        {activeTab === 'features' && (
          <LandingFeatures onLaunchApp={onLaunchApp} />
        )}
        {activeTab === 'use-cases' && (
          <LandingUseCases onLaunchApp={onLaunchApp} />
        )}
        {activeTab === 'security' && (
          <LandingSecurity onLaunchApp={() => onLaunchApp()} />
        )}
        {activeTab === 'docs' && (
          <LandingDocs
            onLaunchApp={() => onLaunchApp()}
            onApplyConfig={(config) => onLaunchApp(undefined, config)}
            onOpenLearnTrack={onOpenLearnTrack}
          />
        )}
      </main>

      {/* 3. Global Footer */}
      <footer className="border-t border-separator bg-surface-1 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <button
                type="button"
                onClick={() => handleSelectTab('overview')}
                className="flex items-center space-x-2 text-left focus-ring rounded group"
                aria-label="ChunkLens Home Overview"
              >
                <div className="h-6 w-6 rounded-control bg-surface-2 border border-separator flex items-center justify-center shrink-0">
                  <ChunkLensLogo className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-text group-hover:text-accent transition-colors">ChunkLens</span>
              </button>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                Interactive client-side document chunking visualizer &amp; token budget optimizer for modern RAG pipelines.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-status-success-subtle text-status-success-text text-2xs font-mono border border-status-success/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success inline-block" />
                  <span>100% Client-Side · Zero Egress</span>
                </div>
              </div>
            </div>

            {/* Architecture Column */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-text font-mono text-2xs mb-2">Product</div>
              <ul className="space-y-1 text-text-secondary">
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('overview')}
                    className="min-h-[28px] py-1 inline-flex items-center hover:text-text transition-colors focus-ring rounded"
                  >
                    Overview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('features')}
                    className="min-h-[28px] py-1 inline-flex items-center hover:text-text transition-colors focus-ring rounded"
                  >
                    Splitter Engines
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('use-cases')}
                    className="min-h-[28px] py-1 inline-flex items-center hover:text-text transition-colors focus-ring rounded"
                  >
                    Use Cases
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsProModalOpen(true)}
                    className="min-h-[28px] py-1 inline-flex items-center text-text-secondary hover:text-text hover:underline transition-colors focus-ring rounded"
                  >
                    Pro &amp; Enterprise
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onLaunchApp()}
                    className="min-h-[28px] py-1 inline-flex items-center text-accent font-medium hover:underline focus-ring rounded"
                  >
                    Launch Visualizer &rarr;
                  </button>
                </li>
              </ul>
            </div>

            {/* Security & Docs */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-text font-mono text-2xs mb-2">Resources</div>
              <ul className="space-y-1 text-text-secondary">
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('security')}
                    className="min-h-[28px] py-1 inline-flex items-center hover:text-text transition-colors focus-ring rounded"
                  >
                    Zero-Egress Security
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('docs')}
                    className="min-h-[28px] py-1 inline-flex items-center hover:text-text transition-colors focus-ring rounded"
                  >
                    Docs &amp; Code Export
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => (onOpenLearnTrack ? onOpenLearnTrack() : onLaunchApp())}
                    className="min-h-[28px] py-1 inline-flex items-center hover:text-text transition-colors focus-ring rounded"
                  >
                    RAG Academy
                  </button>
                </li>
              </ul>
            </div>

            {/* Enterprise Security & Privacy */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-text font-mono text-2xs mb-2">Confidential by Design</div>
              <p className="text-2xs text-text-secondary leading-relaxed font-sans mb-3">
                Zero network egress architecture. Your documents and data never leave your browser sandbox.
              </p>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-control bg-surface-2 border border-separator text-text text-2xs font-mono">
                <span className="h-2 w-2 rounded-full bg-status-success inline-block animate-pulse" />
                <span>Strict CSP Enforced</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-separator/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs text-text-tertiary font-mono">
            <div>
              &copy; {new Date().getFullYear()} ChunkLens. Zero-egress RAG optimization engine. All rights reserved.
            </div>
            <div className="flex items-center space-x-1">
              <span>Crafted for high-performance retrieval augmented generation</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Pro & Enterprise Early Access Modal */}
      {isProModalOpen && (
        <Suspense fallback={null}>
          <ProWaitlistModal
            isOpen={isProModalOpen}
            onClose={() => setIsProModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
