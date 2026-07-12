/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Override Tailwind's amber palette → vivid electric violet shades
        amber: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa', // vivid violet light
          500: '#7c3aed', // electric violet primary
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1679',
          950: '#2e1065',
        },
        dark: {
          900: '#000000', // Absolute pure black canvas
          800: '#08080a', // Deep zinc black (Sidebar/TopBar)
          700: '#0f0f12', // Elevated dark (Cards)
          600: '#15151c', // Inputs & table rows
          500: '#1e1e26', // Border line
          400: '#2c2c38', // Focus borders
        },
        accent: {
          amber: '#7c3aed',       // Electric violet primary
          'amber-light': '#a78bfa', // Vivid violet light
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
        'glow-amber': '0 0 20px rgba(124, 58, 237, 0.25)', // electric violet glow
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
