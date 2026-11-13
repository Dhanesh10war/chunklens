import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { buildCspString } from './src/config/csp';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  const cspContent = buildCspString();

  return {
    plugins: [
      react(),
      {
        name: 'html-transform-csp',
        transformIndexHtml(html) {
          if (!isBuild) return html;
          // In production build, inject strict CSP meta tag generated from single source of truth
          const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspContent}" />`;
          return html.replace('</head>', `    ${cspMeta}\n  </head>`);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: ['js-tiktoken'],
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      allowedHosts: true,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      allowedHosts: true,
    },
    test: {
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts'],
    },
    build: {
      chunkSizeWarningLimit: 6000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'tokenizer-tiktoken': ['js-tiktoken'],
            'pdf-engine': ['pdfjs-dist/legacy/build/pdf.mjs'],
          },
        },
      },
    },
  };
});
