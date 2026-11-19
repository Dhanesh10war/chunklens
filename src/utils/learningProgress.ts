/**
 * Local Learning Progress Store for ChunkLens Learn Track
 * 
 * Rules:
 * - Strictly local storage: nothing leaves the user's browser
 * - Schema v1 with version tracking
 * - Caps: notes <= 20,000 characters per lesson, total storage <= 500 KB
 * - QuotaExceededError graceful fallback
 * - Full reset capability
 */

export type LearningPathId = 'beginner' | 'builder' | 'operator';

export interface QuizProgress {
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
}

export interface LearningProgressState {
  version: 1;
  selectedPathId: LearningPathId | null;
  lastViewedLesson: string | null;
  completedLessons: string[];
  quizScores: Record<string, QuizProgress>;
  notes: Record<string, string>;
  updatedAt: string;
}

const STORAGE_KEY = 'chunklens_learn_progress_v1';
const MAX_NOTE_LENGTH = 20000; // 20,000 characters per lesson
const MAX_TOTAL_BYTES = 500 * 1024; // 500 KB total storage cap

const DEFAULT_STATE: LearningProgressState = {
  version: 1,
  selectedPathId: null,
  lastViewedLesson: null,
  completedLessons: [],
  quizScores: {},
  notes: {},
  updatedAt: new Date().toISOString(),
};

/**
 * Safely reads the user's learning progress from localStorage
 */
export function getLearningProgress(): LearningProgressState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_STATE };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };

    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return {
        ...DEFAULT_STATE,
        ...parsed,
        completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
        quizScores: typeof parsed.quizScores === 'object' && parsed.quizScores ? parsed.quizScores : {},
        notes: typeof parsed.notes === 'object' && parsed.notes ? parsed.notes : {},
      };
    }
    return { ...DEFAULT_STATE };
  } catch (err) {
    console.warn('[LearnProgress] Failed to read progress store:', err);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Safely persists progress to localStorage with quota and size checks
 */
export function saveLearningProgress(progress: Partial<LearningProgressState>): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const current = getLearningProgress();
    const updated: LearningProgressState = {
      ...current,
      ...progress,
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    // Enforce per-lesson note length cap
    if (updated.notes) {
      for (const [slug, note] of Object.entries(updated.notes)) {
        if (note && note.length > MAX_NOTE_LENGTH) {
          updated.notes[slug] = note.slice(0, MAX_NOTE_LENGTH);
        }
      }
    }

    const serialized = JSON.stringify(updated);
    if (serialized.length > MAX_TOTAL_BYTES) {
      console.warn('[LearnProgress] Storage quota cap (500 KB) exceeded; cannot write');
      return false;
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn('[LearnProgress] Browser quota exceeded; storage write aborted.');
    } else {
      console.warn('[LearnProgress] Error saving learning progress:', err);
    }
    return false;
  }
}

/**
 * Marks a lesson slug as complete
 */
export function markLessonComplete(slug: string): boolean {
  const current = getLearningProgress();
  if (!current.completedLessons.includes(slug)) {
    return saveLearningProgress({
      completedLessons: [...current.completedLessons, slug],
      lastViewedLesson: slug,
    });
  }
  return true;
}

/**
 * Records quiz results for a lesson
 */
export function recordQuizScore(quizId: string, score: number, total: number): boolean {
  const current = getLearningProgress();
  const passed = score >= Math.ceil(total * 0.7); // 70% threshold
  const updatedScores = {
    ...current.quizScores,
    [quizId]: {
      score,
      total,
      passed,
      completedAt: new Date().toISOString(),
    },
  };
  return saveLearningProgress({ quizScores: updatedScores });
}

/**
 * Sets the active learning path (beginner, builder, operator)
 */
export function setSelectedPath(pathId: LearningPathId | null): boolean {
  return saveLearningProgress({ selectedPathId: pathId });
}

/**
 * Updates note content for a given lesson
 */
export function saveLessonNote(slug: string, content: string): boolean {
  const current = getLearningProgress();
  const clampedContent = content.slice(0, MAX_NOTE_LENGTH);
  const updatedNotes = {
    ...current.notes,
    [slug]: clampedContent,
  };
  return saveLearningProgress({ notes: updatedNotes });
}

/**
 * Resets all learning progress
 */
export function resetLearningProgress(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.warn('[LearnProgress] Failed to reset learning progress:', err);
    return false;
  }
}
