/**
 * ChunkLens Content Security Policy (Single Source of Truth)
 * Enforces zero server egress and self-hosted assets in production.
 */

export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'worker-src': ["'self'", 'blob:'],
  'connect-src': ["'none'"], // ZERO cross-origin and zero network egress
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
  'frame-ancestors': ["'none'"],
};

export function buildCspString(options: { isMeta?: boolean } = {}): string {
  return Object.entries(CSP_DIRECTIVES)
    .filter(([directive]) => {
      // <meta http-equiv="Content-Security-Policy"> ignores frame-ancestors and logs a console error
      if (options.isMeta && directive === 'frame-ancestors') {
        return false;
      }
      return true;
    })
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export const STRICT_CSP_HEADER = buildCspString({ isMeta: false });
export const STRICT_CSP_META = buildCspString({ isMeta: true });
