/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EBF4F6',
          100: '#D9EDF7',
          200: '#B8DFE6',
          300: '#8AC8D8',
          400: '#4895EF',
          500: '#1A759F',
          600: '#1E6091',
          700: '#184E77',
          800: '#133C55',
          900: '#0E2A38',
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          hover: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 18px -2px rgba(30, 96, 145, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 24px -3px rgba(30, 96, 145, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 40px -15px rgba(30, 96, 145, 0.16)',
      }
    },
  },
  plugins: [],
}
