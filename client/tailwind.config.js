/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#000000', // Absolute pure black canvas
          800: '#08080a', // Deep zinc black (Sidebar/TopBar)
          700: '#0f0f12', // Elevated dark (Cards)
          600: '#15151c', // Inputs & table rows
          500: '#1e1e26', // Border line
          400: '#2c2c38', // Focus borders
        },
        accent: {
          amber: '#f59e0b', // Vibrant amber
          'amber-light': '#fbbf24',
          blue: '#3b82f6', // Neon blue
          'blue-light': '#60a5fa',
          green: '#10b981', // Emerald green
          'green-light': '#34d399',
          red: '#ef4444', // High-contrast red
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
