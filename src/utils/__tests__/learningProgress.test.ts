import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLearningProgress,
  saveLearningProgress,
  markLessonComplete,
  recordQuizScore,
  setSelectedPath,
  saveLessonNote,
  resetLearningProgress,
} from '../learningProgress';

describe('Learning Progress Store', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  it('initializes with default empty v1 state', () => {
    const progress = getLearningProgress();
    expect(progress.version).toBe(1);
    expect(progress.selectedPathId).toBeNull();
    expect(progress.lastViewedLesson).toBeNull();
    expect(progress.completedLessons).toEqual([]);
    expect(progress.quizScores).toEqual({});
    expect(progress.notes).toEqual({});
  });

  it('marks lessons as complete and sets lastViewedLesson', () => {
    markLessonComplete('1-1-what-is-rag');
    const p1 = getLearningProgress();
    expect(p1.completedLessons).toContain('1-1-what-is-rag');
    expect(p1.lastViewedLesson).toBe('1-1-what-is-rag');

    // Duplicate call is idempotent
    markLessonComplete('1-1-what-is-rag');
    const p2 = getLearningProgress();
    expect(p2.completedLessons).toHaveLength(1);
  });

  it('records quiz scores with passing calculation', () => {
    recordQuizScore('quiz-1-1', 2, 2);
    const p1 = getLearningProgress();
    expect(p1.quizScores['quiz-1-1'].score).toBe(2);
    expect(p1.quizScores['quiz-1-1'].passed).toBe(true);

    recordQuizScore('quiz-3-2', 1, 2);
    const p2 = getLearningProgress();
    expect(p2.quizScores['quiz-3-2'].passed).toBe(false);
  });

  it('clamps lesson notes to 20,000 characters', () => {
    const hugeNote = 'a'.repeat(25000);
    saveLessonNote('1-1-what-is-rag', hugeNote);

    const p = getLearningProgress();
    expect(p.notes['1-1-what-is-rag'].length).toBe(20000);
  });

  it('sets selected learning path', () => {
    setSelectedPath('builder');
    expect(getLearningProgress().selectedPathId).toBe('builder');

    setSelectedPath(null);
    expect(getLearningProgress().selectedPathId).toBeNull();
  });

  it('resets progress cleanly', () => {
    markLessonComplete('1-1-what-is-rag');
    saveLessonNote('1-1-what-is-rag', 'my notes');
    expect(getLearningProgress().completedLessons).toHaveLength(1);

    resetLearningProgress();
    const fresh = getLearningProgress();
    expect(fresh.completedLessons).toEqual([]);
    expect(fresh.notes).toEqual({});
  });

  it('handles QuotaExceededError gracefully without crashing', () => {
    const errorStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw err;
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    vi.stubGlobal('localStorage', errorStorage);
    vi.stubGlobal('window', { localStorage: errorStorage });

    const success = saveLearningProgress({ completedLessons: ['1-1-what-is-rag'] });
    expect(success).toBe(false);
  });
});
