/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic Enterprise Tokens (Linear / Vercel grade)
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',

        // Backwards-compatible aliases mapping to semantic tokens
        canvas: 'var(--bg-base)',
        panel: 'var(--bg-surface)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-elevated)',
        'surface-elevated': 'var(--bg-elevated)',

        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          hover: 'var(--border-hover)',
        },

        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },

        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          ring: 'var(--accent-ring)',
          solid: 'var(--accent-solid)',
          'solid-hover': 'var(--accent-solid-hover)',
          'on-solid': 'var(--on-accent)',
        },

        // Single primary accent mapping
        primary: {
          DEFAULT: 'var(--accent)',
          50: 'var(--accent-subtle)',
          400: 'var(--accent)',
          500: 'var(--accent)',
          600: 'var(--accent)',
          700: 'var(--accent-hover)',
        },

        status: {
          error: 'var(--status-error)',
          danger: 'var(--status-danger, var(--status-error))',
          warn: 'var(--status-warn)',
          success: 'var(--status-success)',
        },
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px', letterSpacing: '0.01em' }],
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0' }],
        'sm': ['13px', { lineHeight: '18px', letterSpacing: '-0.005em' }],
        'base': ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
        'md': ['16px', { lineHeight: '24px', letterSpacing: '-0.015em' }],
        'lg': ['20px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        'xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.025em' }],
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', '"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Monaco', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        elevated: '0 4px 12px 0 rgba(0, 0, 0, 0.35)',
        modal: '0 12px 32px 0 rgba(0, 0, 0, 0.50)',
      },
    },
  },
  plugins: [],
}
