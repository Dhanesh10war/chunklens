import React, { useState, useEffect, useMemo, useRef } from 'react';
import './learn.css';
import {
  MODULES,
  PATH_DESCRIPTIONS,
  findLessonBySlug,
  getAllLessons,
  LessonMeta,
} from '../../data/learning/curriculum';
import { getLessonMarkdown } from '../../data/learning/lessons';
import { ContentRenderer } from './ContentRenderer';
import {
  getLearningProgress,
  markLessonComplete,
  setSelectedPath,
  saveLessonNote,
  resetLearningProgress,
  LearningPathId,
} from '../../utils/learningProgress';
import { ArrowLeft, CheckCircle2, Circle, Clock, Compass, BookOpen, RotateCcw } from 'lucide-react';
import { ChunkLensLogo } from '../ui/ChunkLensLogo';

interface LearnViewProps {
  currentLessonSlug: string | null;
  onNavigateLesson: (slug: string | null) => void;
  onLaunchWorkbench: (shareParams?: string) => void;
  onOpenLanding: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  currentLessonSlug,
  onNavigateLesson,
  onLaunchWorkbench,
  onOpenLanding,
}) => {
  const [progressState, setProgressState] = useState(() => getLearningProgress());
  const [selectedPath, setSelectedPathState] = useState<LearningPathId | null>(
    progressState.selectedPathId
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync progress state on load or lesson change
  useEffect(() => {
    const current = getLearningProgress();
    setProgressState(current);
    setSelectedPathState(current.selectedPathId);
    if (currentLessonSlug && current.notes[currentLessonSlug]) {
      setNoteText(current.notes[currentLessonSlug]);
    } else {
      setNoteText('');
    }
  }, [currentLessonSlug]);

  // Keyboard shortcut: '/' focuses the search box (Cmd+K stays command palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !currentLessonSlug) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLessonSlug]);

  const handleSelectPath = (pathId: LearningPathId | null) => {
    setSelectedPathState(pathId);
    setSelectedPath(pathId);
  };

  const handleToggleComplete = (slug: string) => {
    markLessonComplete(slug);
    setProgressState(getLearningProgress());
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 20000);
    setNoteText(text);
    if (currentLessonSlug) {
      saveLessonNote(currentLessonSlug, text);
    }
  };

  const handleResetProgress = () => {
    resetLearningProgress();
    setProgressState(getLearningProgress());
    setShowResetConfirm(false);
  };

  const activeLesson: LessonMeta | undefined = useMemo(() => {
    return currentLessonSlug ? findLessonBySlug(currentLessonSlug) : undefined;
  }, [currentLessonSlug]);

  const activeMarkdown = useMemo(() => {
    return currentLessonSlug ? getLessonMarkdown(currentLessonSlug) : undefined;
  }, [currentLessonSlug]);

  const allLessons = useMemo(() => getAllLessons(), []);
  const availableLessons = useMemo(() => allLessons.filter((l) => l.status === 'available'), [allLessons]);
  const completedCount = useMemo(
    () => progressState.completedLessons.length,
    [progressState.completedLessons]
  );

  // Next / Previous lesson navigation
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!activeLesson) return { prevLesson: null, nextLesson: null };
    const currentIndex = availableLessons.findIndex((l) => l.slug === activeLesson.slug);
    return {
      prevLesson: currentIndex > 0 ? availableLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < availableLessons.length - 1 ? availableLessons[currentIndex + 1] : null,
    };
  }, [activeLesson, availableLessons]);

  // Find module title for breadcrumbs
  const activeModule = useMemo(() => {
    if (!activeLesson) return undefined;
    return MODULES.find((m) => m.id === activeLesson.moduleId);
  }, [activeLesson]);

  return (
    <div className="learn-view-root bg-bg text-text">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-surface-1/95 backdrop-blur border-b border-separator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={onOpenLanding}
              className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors font-medium focus-ring rounded"
            >
              <div className="h-6 w-6 rounded-control bg-surface-2 border border-separator flex items-center justify-center shrink-0">
                <ChunkLensLogo className="h-3.5 w-3.5" />
              </div>
              <span>ChunkLens</span>
            </button>
            <span className="text-text-muted">/</span>
            <button
              type="button"
              onClick={() => onNavigateLesson(null)}
              className={`${
                !currentLessonSlug
                  ? 'text-accent font-semibold'
                  : 'text-text-secondary hover:text-accent'
              } transition-colors`}
            >
              Learn Track
            </button>
            {activeLesson && (
              <>
                <span className="text-text-muted">/</span>
                <span className="truncate max-w-[200px] sm:max-w-xs text-accent font-semibold">
                  {activeLesson.title}
                </span>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onLaunchWorkbench()}
              className="px-3 py-1.5 rounded-lg border border-separator bg-surface-1 text-xs font-medium text-text-secondary hover:bg-surface-2 transition-colors min-h-[32px] flex items-center gap-1.5"
            >
              <span>Launch Workbench</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full min-w-0">
        {/* VIEW 1: Individual Lesson Reading Mode */}
        {activeLesson ? (
          <div className="space-y-6">
            {/* Back button */}
            <button
              type="button"
              onClick={() => onNavigateLesson(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-accent transition-colors min-h-[32px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Curriculum Map</span>
            </button>

            {/* Header info bar */}
            <div className="p-4 sm:p-5 rounded-xl border border-separator bg-surface-1 shadow-card flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-accent block mb-1">
                  {activeModule?.title || 'ChunkLens Curriculum'}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-text">
                  {activeLesson.title}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activeLesson.readTime}
                  </span>
                  <span>•</span>
                  <span>Stored entirely on this device</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(activeLesson.slug)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                    progressState.completedLessons.includes(activeLesson.slug)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {progressState.completedLessons.includes(activeLesson.slug) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-slate-400" />
                      <span>Mark Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Advisory Prerequisite Alert (Non-blocking) */}
            {activeLesson.prerequisites.length > 0 &&
              !activeLesson.prerequisites.every((prereq) =>
                progressState.completedLessons.includes(prereq)
              ) && (
                <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold block mb-0.5">Recommended Prerequisite:</span>
                    <span>
                      This lesson builds on principles introduced in{' '}
                      {activeLesson.prerequisites.map((pSlug, idx) => {
                        const prereqLesson = findLessonBySlug(pSlug);
                        return (
                          <button
                            key={pSlug}
                            type="button"
                            onClick={() => onNavigateLesson(pSlug)}
                            className="font-medium underline hover:text-amber-700 dark:hover:text-amber-100 ml-1"
                          >
                            {prereqLesson?.title || pSlug}
                            {idx < activeLesson.prerequisites.length - 1 ? ',' : ''}
                          </button>
                        );
                      })}
                      . You are free to proceed directly.
                    </span>
                  </div>
                </div>
              )}

            {/* Render Lesson Markdown */}
            {activeMarkdown ? (
              <div className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <ContentRenderer
                  content={activeMarkdown}
                  onNavigateLesson={onNavigateLesson}
                  onLaunchWorkbench={onLaunchWorkbench}
                />
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <p className="text-slate-500">Lesson content coming soon.</p>
              </div>
            )}

            {/* Lesson Scratchpad Notes */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Personal Lesson Notes (Stored on this device)
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {noteText.length} / 20,000 chars
                </span>
              </div>
              <textarea
                value={noteText}
                onChange={handleNoteChange}
                placeholder="Jot down notes or observations as you test partitioning..."
                rows={3}
                className="w-full p-2.5 text-xs font-sans rounded-lg border border-separator bg-surface-1 text-text focus-ring resize-y"
              />
            </div>

            {/* Bottom Lesson Navigation */}
            <div className="pt-4 border-t border-separator flex items-center justify-between gap-4">
              {prevLesson ? (
                <button
                  type="button"
                  onClick={() => onNavigateLesson(prevLesson.slug)}
                  className="px-4 py-2 rounded-lg border border-separator text-xs font-medium text-text-secondary hover:bg-surface-2 transition-colors min-h-[40px] flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous: {prevLesson.title}</span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  type="button"
                  onClick={() => onNavigateLesson(nextLesson.slug)}
                  className="px-4 py-2 rounded-lg learn-primary-btn text-xs font-medium transition-colors min-h-[40px] flex items-center gap-2 shadow-sm"
                >
                  <span>Next: {nextLesson.title}</span>
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateLesson(null)}
                  className="px-4 py-2 rounded-lg learn-primary-btn text-xs font-medium transition-colors min-h-[40px]"
                >
                  Back to Curriculum
                </button>
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: Visual Curriculum Map */
          <div className="space-y-8">
            {/* Header Hero */}
            <div className="p-6 sm:p-8 rounded-2xl border border-separator bg-surface-1 shadow-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-subtle text-accent border border-accent/25 mb-3">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Visual RAG & Chunking Curriculum</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight font-serif">
                    ChunkLens Learn Track
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-text-secondary leading-relaxed">
                    Master retrieval-augmented generation and text partitioning through interactive simulations, real client-side chunking execution, and grounded empirical models.
                  </p>
                </div>

                {/* Overall Progress Counter */}
                <div className="p-4 rounded-xl border border-separator bg-surface-2 min-w-[200px] flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold text-text-muted block mb-1">
                    Completed Lessons
                  </span>
                  <div className="text-3xl font-bold text-accent font-mono">
                    {completedCount} / {availableLessons.length}
                  </div>
                  <span className="text-xs text-text-muted mt-1">
                    {Math.round((completedCount / (availableLessons.length || 1)) * 100)}% available track
                  </span>
                </div>
              </div>

              {/* "Continue where you left off" banner if available */}
              {progressState.lastViewedLesson && (
                <div className="mt-6 pt-5 border-t border-separator flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span className="text-text-secondary">
                      Continue where you left off:{' '}
                      <strong className="text-text">
                        {findLessonBySlug(progressState.lastViewedLesson)?.title || progressState.lastViewedLesson}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateLesson(progressState.lastViewedLesson)}
                    className="px-3 py-1.5 rounded-lg learn-primary-btn font-medium transition-colors min-h-[32px]"
                  >
                    Resume Lesson
                  </button>
                </div>
              )}
            </div>

            {/* Path Picker & Search Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Path Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectPath(null)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[32px] ${
                    selectedPath === null
                      ? 'learn-path-btn-active shadow-sm font-semibold'
                      : 'learn-path-btn-inactive'
                  }`}
                >
                  All Modules
                </button>
                {(['beginner', 'builder', 'operator'] as LearningPathId[]).map((pathId) => (
                  <button
                    key={pathId}
                    type="button"
                    onClick={() => handleSelectPath(pathId)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[32px] ${
                      selectedPath === pathId
                        ? 'learn-path-btn-active shadow-sm font-semibold'
                        : 'learn-path-btn-inactive'
                    }`}
                  >
                    {PATH_DESCRIPTIONS[pathId].title}
                  </button>
                ))}
              </div>

              {/* Lesson Search Filter (Shortcut: /) */}
              <div className="relative min-w-[220px]">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter lessons... (press /)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-separator bg-surface-1 text-text focus-ring min-h-[36px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Path Description Banner if selected */}
            {selectedPath && (
              <div className="p-4 rounded-xl border border-separator bg-surface-2 text-xs text-text">
                <span className="font-semibold block mb-0.5">
                  {PATH_DESCRIPTIONS[selectedPath].title}: {PATH_DESCRIPTIONS[selectedPath].subtitle}
                </span>
                <span>{PATH_DESCRIPTIONS[selectedPath].summary}</span>
              </div>
            )}

            {/* Module Curriculum Grid */}
            <div className="space-y-6">
              {MODULES.map((module) => {
                // Filter lessons by search query and selected path
                const filteredLessons = module.lessons.filter((l) => {
                  const matchesSearch =
                    !searchQuery ||
                    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.summary.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesPath = !selectedPath || l.pathIds.includes(selectedPath);
                  return matchesSearch && matchesPath;
                });

                if (filteredLessons.length === 0) return null;

                const completedInModule = module.lessons.filter((l) =>
                  progressState.completedLessons.includes(l.slug)
                ).length;

                return (
                  <section
                    key={module.id}
                    className="p-5 sm:p-6 rounded-2xl border border-separator bg-surface-1 shadow-card"
                  >
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-separator">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-text">
                          {module.title}
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">
                          {module.description}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-surface-2 text-text-secondary">
                        {completedInModule} / {module.lessons.length} Completed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredLessons.map((lesson) => {
                        const isCompleted = progressState.completedLessons.includes(lesson.slug);
                        const isAvailable = lesson.status === 'available';

                        if (isAvailable) {
                          return (
                            <button
                              key={lesson.slug}
                              type="button"
                              onClick={() => onNavigateLesson(lesson.slug)}
                              className="text-left p-4 rounded-xl border border-separator hover:border-accent bg-surface-1 hover:bg-surface-2/40 transition-all flex flex-col justify-between group min-h-[140px]"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-xs font-semibold text-accent">
                                    Available
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Clock className="w-3 h-3" />
                                    <span>{lesson.readTime}</span>
                                  </div>
                                </div>
                                <h3 className="text-sm font-semibold text-text group-hover:text-accent transition-colors leading-snug">
                                  {lesson.title}
                                </h3>
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                                  {lesson.summary}
                                </p>
                              </div>

                              <div className="mt-3 pt-2 border-t border-separator flex items-center justify-between text-xs">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Completed
                                  </span>
                                ) : (
                                  <span className="text-accent font-medium group-hover:underline">
                                    Start Lesson →
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        }

                        // Planned lesson (non-clickable card)
                        return (
                          <div
                            key={lesson.slug}
                            className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/20 opacity-70 flex flex-col justify-between min-h-[140px]"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Planned
                                </span>
                                <span className="text-xs learn-subtle-text">{lesson.readTime}</span>
                              </div>
                              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {lesson.title}
                              </h3>
                              <p className="text-xs learn-subtle-text mt-1 line-clamp-2">
                                {lesson.summary}
                              </p>
                            </div>
                            <div className="mt-3 pt-2 text-xs learn-subtle-text italic">
                              In development
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Reset Progress Footer */}
            <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>All progress data is stored strictly in your browser (zero remote egress).</span>
              <div>
                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Progress</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400 font-medium">Clear all progress?</span>
                    <button
                      type="button"
                      onClick={handleResetProgress}
                      className="px-2 py-1 rounded bg-red-600 text-white font-medium text-xs"
                    >
                      Yes, Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
};
