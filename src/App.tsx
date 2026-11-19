import React, { useState, useEffect, Suspense } from 'react';
import { ChunkingConfig } from './engine/types';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ChunkLoadErrorBoundary } from './components/ui/ChunkLoadErrorBoundary';
import { ModalLoadingFallback } from './components/ui/ModalLoadingFallback';
import { parseSharedConfigFromUrl } from './utils/shareUrl';

// Lazy-load views to keep root entry minimal
const prefetchLearnView = () =>
  import('./components/learning/LearnView').then((m) => ({ default: m.LearnView }));
const prefetchLandingPage = () =>
  import('./components/landing/LandingPage').then((m) => ({ default: m.LandingPage }));
const prefetchWorkbenchView = () =>
  import('./components/WorkbenchView').then((m) => ({ default: m.WorkbenchView }));

const LearnView = React.lazy(prefetchLearnView);
const LandingPage = React.lazy(prefetchLandingPage);
const WorkbenchView = React.lazy(prefetchWorkbenchView);

export const AppContent: React.FC = () => {
  const [currentLessonSlug, setCurrentLessonSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('lesson');
    }
    return null;
  });

  const [currentView, setCurrentView] = useState<'app' | 'landing' | 'learn'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'learn' || window.location.hash === '#learn') {
        return 'learn';
      }
      if (params.get('view') === 'app' || window.location.hash === '#app') {
        return 'app';
      }
      if (params.get('view') === 'landing' || window.location.hash === '#landing') {
        return 'landing';
      }
    }
    // Landing page is the default root experience
    return 'landing';
  });

  const [workbenchSampleId, setWorkbenchSampleId] = useState<string | null | undefined>(undefined);
  const [workbenchConfig, setWorkbenchConfig] = useState<ChunkingConfig | null>(null);

  const { success } = useToast();

  const handleOpenLandingPage = () => {
    setCurrentView('landing');
    setCurrentLessonSlug(null);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('lesson');
      url.hash = '';
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleOpenLearnView = (slug?: string | null) => {
    setCurrentView('learn');
    setCurrentLessonSlug(slug || null);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'learn');
      if (slug) {
        url.searchParams.set('lesson', slug);
      } else {
        url.searchParams.delete('lesson');
      }
      url.hash = '';
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleLaunchApp = (sampleId?: string, newConfig?: ChunkingConfig) => {
    if (newConfig) {
      setWorkbenchConfig(newConfig);
      success('Applied calibrated preset to workbench');
    }
    if (sampleId) {
      setWorkbenchSampleId(sampleId);
    } else if (!newConfig) {
      setWorkbenchSampleId(null);
    }
    setCurrentView('app');
    setCurrentLessonSlug(null);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'app');
      url.searchParams.delete('lesson');
      url.hash = '';
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleLaunchFromShareUrl = (shareUrl?: string) => {
    if (shareUrl) {
      try {
        const parsed = parseSharedConfigFromUrl(shareUrl);
        if (parsed) {
          if (parsed.sampleId) {
            setWorkbenchSampleId(parsed.sampleId);
          }
          if (parsed.config && Object.keys(parsed.config).length > 0) {
            setWorkbenchConfig(parsed.config as ChunkingConfig);
          }
        }
      } catch (e) {
        console.warn('Failed to parse share url:', e);
      }
    }
    handleLaunchApp();
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'learn' || window.location.hash === '#learn') {
        setCurrentView('learn');
        setCurrentLessonSlug(params.get('lesson'));
      } else if (view === 'app' || window.location.hash === '#app') {
        setCurrentView('app');
        setCurrentLessonSlug(null);
      } else {
        setCurrentView('landing');
        setCurrentLessonSlug(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentView === 'landing') {
    return (
      <ChunkLoadErrorBoundary fallbackTitle="Failed to load Landing Page">
        <Suspense fallback={<ModalLoadingFallback label="Loading ChunkLens..." />}>
          <LandingPage
            onLaunchApp={handleLaunchApp}
            onOpenLearnTrack={handleOpenLearnView}
          />
        </Suspense>
      </ChunkLoadErrorBoundary>
    );
  }

  if (currentView === 'learn') {
    return (
      <ChunkLoadErrorBoundary fallbackTitle="Failed to load Learn Track">
        <Suspense fallback={<ModalLoadingFallback label="Loading Learn Track..." />}>
          <LearnView
            currentLessonSlug={currentLessonSlug}
            onNavigateLesson={(slug) => handleOpenLearnView(slug)}
            onLaunchWorkbench={handleLaunchFromShareUrl}
            onOpenLanding={handleOpenLandingPage}
          />
        </Suspense>
      </ChunkLoadErrorBoundary>
    );
  }

  return (
    <ChunkLoadErrorBoundary fallbackTitle="Failed to load Workbench">
      <Suspense fallback={<ModalLoadingFallback label="Loading Workbench..." />}>
        <WorkbenchView
          onOpenLanding={handleOpenLandingPage}
          onOpenLearnTrack={handleOpenLearnView}
          initialSampleId={workbenchSampleId}
          initialConfig={workbenchConfig}
        />
      </Suspense>
    </ChunkLoadErrorBoundary>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};
