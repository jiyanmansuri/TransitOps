/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode toggling
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: 'rgb(var(--bg-canvas) / <alpha-value>)',
          800: 'rgb(var(--bg-surface-elevated) / <alpha-value>)',
          700: 'rgb(var(--bg-surface-card) / <alpha-value>)',
          600: 'rgb(var(--bg-surface-row) / <alpha-value>)',
          500: 'rgb(var(--border-line) / <alpha-value>)',
          400: 'rgb(var(--border-focus) / <alpha-value>)',
        },
        gray: {
          100: 'rgb(var(--text-main) / <alpha-value>)',
          200: 'rgb(var(--text-main-muted) / <alpha-value>)',
          300: 'rgb(var(--text-muted) / <alpha-value>)',
          400: 'rgb(var(--text-sub) / <alpha-value>)',
          500: 'rgb(var(--text-muted-dark) / <alpha-value>)',
        },
        accent: {
          amber: '#f59e0b',
          'amber-light': '#fbbf24',
          blue: '#3b82f6',
          'blue-light': '#60a5fa',
          green: '#10b981',
          'green-light': '#34d399',
          red: '#ef4444',
          'red-light': '#f87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.15)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
