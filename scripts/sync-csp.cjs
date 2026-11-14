const fs = require('fs');
const path = require('path');

const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'worker-src': ["'self'", 'blob:'],
  'connect-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
  'frame-ancestors': ["'none'"],
};

function buildCspString({ isMeta = false } = {}) {
  return Object.entries(CSP_DIRECTIVES)
    .filter(([directive]) => !(isMeta && directive === 'frame-ancestors'))
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

const headerCsp = buildCspString({ isMeta: false });
const metaCsp = buildCspString({ isMeta: true });

// 1. Generate / update vercel.json
const vercelConfig = {
  framework: 'vite',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  headers: [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: headerCsp,
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Cache-Control',
          value: 'no-cache',
        },
      ],
    },
    {
      source: '/assets/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/fonts/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=604800',
        },
      ],
    },
  ],
};

const vercelPath = path.resolve(__dirname, '../vercel.json');
fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2) + '\n', 'utf8');

// 2. Generate / update public/_headers (Cloudflare Pages)
const cloudflareHeaders = `/*
  Content-Security-Policy: ${headerCsp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=604800
`;

const publicHeadersPath = path.resolve(__dirname, '../public/_headers');
fs.writeFileSync(publicHeadersPath, cloudflareHeaders, 'utf8');

console.log('[CSP Sync] vercel.json and public/_headers synchronized successfully.');
console.log('  Header CSP length:', headerCsp.length);
console.log('  Meta CSP length:  ', metaCsp.length, '(omits frame-ancestors)');

module.exports = { CSP_DIRECTIVES, buildCspString, headerCsp, metaCsp };
