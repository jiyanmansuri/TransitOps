/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Redefine colors to use CSS variables for theme support
        dark: {
          900: 'rgb(var(--color-dark-900) / <alpha-value>)',
          800: 'rgb(var(--color-dark-800) / <alpha-value>)',
          700: 'rgb(var(--color-dark-700) / <alpha-value>)',
          600: 'rgb(var(--color-dark-600) / <alpha-value>)',
          500: 'rgb(var(--color-dark-500) / <alpha-value>)',
          400: 'rgb(var(--color-dark-400) / <alpha-value>)',
        },
        gray: {
          50:  'rgb(var(--color-gray-50) / <alpha-value>)',
          100: 'rgb(var(--color-gray-100) / <alpha-value>)',
          200: 'rgb(var(--color-gray-200) / <alpha-value>)',
          300: 'rgb(var(--color-gray-300) / <alpha-value>)',
          400: 'rgb(var(--color-gray-400) / <alpha-value>)',
          500: 'rgb(var(--color-gray-500) / <alpha-value>)',
          600: 'rgb(var(--color-gray-600) / <alpha-value>)',
          700: 'rgb(var(--color-gray-700) / <alpha-value>)',
          800: 'rgb(var(--color-gray-800) / <alpha-value>)',
          900: 'rgb(var(--color-gray-900) / <alpha-value>)',
        },
        white: 'rgb(var(--color-white) / <alpha-value>)',
        black: 'rgb(var(--color-black) / <alpha-value>)',
        
        accent: {
          amber: 'rgb(var(--color-accent-amber) / <alpha-value>)',
          'amber-light': 'rgb(var(--color-accent-amber-light) / <alpha-value>)',
          blue: 'rgb(var(--color-accent-blue) / <alpha-value>)',
          'blue-light': 'rgb(var(--color-accent-blue-light) / <alpha-value>)',
          green: 'rgb(var(--color-accent-green) / <alpha-value>)',
          'green-light': 'rgb(var(--color-accent-green-light) / <alpha-value>)',
          red: 'rgb(var(--color-accent-red) / <alpha-value>)',
          'red-light': 'rgb(var(--color-accent-red-light) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-amber': '0 0 20px rgba(var(--color-accent-amber), 0.30)', // lighter violet glow
        'glow-blue': '0 0 15px rgba(var(--color-accent-blue), 0.15)',
        'glow-green': '0 0 15px rgba(var(--color-accent-green), 0.15)',
      }
    },
  },
  plugins: [],
}


