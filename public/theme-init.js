/**
 * ChunkLens Instant Theme Initializer
 * Runs synchronously in <head> before first paint to prevent theme flash.
 * Sets class ("dark" or "light"), data-theme, and style.colorScheme.
 */
(function () {
  try {
    var stored = localStorage.getItem('chunklens_theme');
    var isDark =
      stored === 'dark' ||
      ((!stored || stored === 'system') &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    var effective = isDark ? 'dark' : 'light';
    root.classList.remove('dark', 'light');
    root.classList.add(effective);
    root.setAttribute('data-theme', effective);
    root.style.colorScheme = effective;
  } catch (e) {
    // Fail silently in restrictive environments
  }
})();
