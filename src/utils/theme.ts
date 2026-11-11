import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'chunklens_theme';

export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const effective = theme === 'system' ? getSystemTheme() : theme;

  root.classList.remove('dark', 'light');
  root.classList.add(effective);
  root.style.colorScheme = effective;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in restrictive environments
    }

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((curr) => {
      if (curr === 'dark') return 'light';
      return 'dark';
    });
  };

  const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');

  return { theme, isDark, setTheme: setThemeState, toggleTheme };
}
