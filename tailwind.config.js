/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Core Surfaces & Neutrals
        bg: 'var(--bg)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'surface-toolbar': 'var(--surface-toolbar)',
        separator: {
          DEFAULT: 'var(--separator)',
          subtle: 'var(--separator-subtle)',
        },

        // Typography Tokens
        text: {
          DEFAULT: 'var(--text)',
          primary: 'var(--text)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },

        // Unified System Accent
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          ring: 'var(--accent-ring)',
          solid: 'var(--accent)',
          'solid-hover': 'var(--accent-hover)',
          'on-solid': 'var(--on-accent)',
        },

        // Heatmap Tokens
        heat: {
          low: 'var(--heat-low)',
          mid: 'var(--heat-mid)',
          high: 'var(--heat-high)',
          self: 'var(--heat-self)',
          'text-light': 'var(--heat-text-on-light)',
          'text-dark': 'var(--heat-text-on-dark)',
        },

        // Muted Semantic Status Indicators
        status: {
          success: 'var(--status-success)',
          'success-subtle': 'var(--status-success-subtle)',
          'success-text': 'var(--status-success-text)',
          warn: 'var(--status-warn)',
          'warn-subtle': 'var(--status-warn-subtle)',
          'warn-text': 'var(--status-warn-text)',
          error: 'var(--status-error)',
          'error-subtle': 'var(--status-error-subtle)',
          'error-text': 'var(--status-error-text)',
          danger: 'var(--status-danger)',
        },

        // Backwards-compatible semantic aliases
        'bg-base': 'var(--bg)',
        'bg-surface': 'var(--surface-1)',
        'bg-elevated': 'var(--surface-2)',
        canvas: 'var(--bg)',
        panel: 'var(--surface-1)',
        surface: 'var(--surface-1)',
        subtle: 'var(--surface-2)',
        'surface-elevated': 'var(--surface-2)',
        border: {
          subtle: 'var(--separator-subtle)',
          DEFAULT: 'var(--separator)',
          default: 'var(--separator)',
          hover: 'var(--border-hover)',
        },
        primary: {
          DEFAULT: 'var(--accent)',
          50: 'var(--accent-subtle)',
          400: 'var(--accent)',
          500: 'var(--accent)',
          600: 'var(--accent)',
          700: 'var(--accent-hover)',
        },
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0' }],
        'sm': ['13px', { lineHeight: '18px', letterSpacing: '-0.005em' }],
        'base': ['15px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        'md': ['15px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        'lg': ['20px', { lineHeight: '26px', letterSpacing: '-0.015em' }],
        'xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        '2xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        control: '8px',
        lg: '8px',
        card: '12px',
        xl: '12px',
        panel: '16px',
        '2xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        modal: 'var(--shadow-modal)',
        'inner-highlight': 'inset 0 1px 0 oklch(1 0 0 / 0.06)',
      },
      zIndex: {
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
  plugins: [],
}
