/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Override Tailwind's amber palette → Odoo purple shades
        amber: {
          50:  '#f2f0f9',
          100: '#e6e1f3',
          200: '#cfc5e7',
          300: '#b1a1d7',
          400: '#8f7fc2', // light Odoo purple
          500: '#71639e', // Odoo primary purple
          600: '#5a4d87',
          700: '#483d6d',
          800: '#383056',
          900: '#2b2643',
          950: '#1b172a',
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
          amber: '#71639e',       // Odoo primary purple
          'amber-light': '#8f7fc2', // Odoo light purple
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
        'glow-amber': '0 0 15px rgba(113, 99, 158, 0.15)', // Odoo purple glow
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
