import { useState, useEffect, useCallback } from 'react';

export type Theme = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'chunklens_theme';

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, options: { animate?: boolean } = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const effective = theme === 'system' ? getSystemTheme() : theme;

  // Animate with 200ms color transition only if explicitly requested (e.g. user toggle)
  // and user has not enabled reduced motion.
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (options.animate && !prefersReducedMotion) {
    root.classList.add('theme-transitioning');
    window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 200);
  }

  root.classList.remove('dark', 'light');
  root.classList.add(effective);
  root.setAttribute('data-theme', effective);
  root.style.colorScheme = effective;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme, { animate: true });
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors in restricted sandboxes
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle toggle: if dark -> light, if light -> dark
    setThemeState((curr) => {
      const effective = curr === 'system' ? getSystemTheme() : curr;
      const next: Theme = effective === 'dark' ? 'light' : 'dark';
      applyTheme(next, { animate: true });
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // Sync initial theme without animation
    applyTheme(theme, { animate: false });

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system', { animate: true });
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
  const isDark = effectiveTheme === 'dark';

  return {
    theme,
    isDark,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };
}
