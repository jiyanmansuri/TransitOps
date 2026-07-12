/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode toggling
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: 'var(--bg-canvas)',
          800: 'var(--bg-surface-elevated)',
          700: 'var(--bg-surface-card)',
          600: 'var(--bg-surface-row)',
          500: 'var(--border-line)',
          400: 'var(--border-focus)',
        },
        gray: {
          100: 'var(--text-main)',
          200: 'var(--text-main-muted)',
          300: 'var(--text-muted)',
          400: 'var(--text-sub)',
          500: 'var(--text-muted-dark)',
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
