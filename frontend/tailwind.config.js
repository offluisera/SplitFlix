/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f3e8ff',
          100: '#e9d5ff',
          200: '#d8b4fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#9333ea',
          600: '#7c3aed',  // primary
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          950: '#0a0a0a',  // fundo principal
          900: '#111111',
          800: '#1a1a1a',
          700: '#1f2937',  // grafite
          600: '#374151',
          500: '#4b5563',
        },
        neon: '#a855f7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6d28d9 0%, #9333ea 50%, #a855f7 100%)',
        'gradient-card':  'linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.95) 100%)',
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-in-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'shimmer':   'shimmer 1.5s infinite',
        'pulse-slow':'pulse 3s infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
