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
        brand: {
          blue: '#0062E0',
          'blue-hover': '#0050B8',
          'blue-light': '#EFF6FF',
          'blue-subtle': '#F0F7FF',
          teal: '#00B388',
          'teal-hover': '#009670',
          'teal-light': '#E6F9F4',
          'teal-subtle': '#F0FDF9',
        },
        navy: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1F5F9',
          subtle: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        dark: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          card: '#FFFFFF',
          hover: '#EFF6FF',
          border: '#E2E8F0',
        },
        orange: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0062e0',
          600: '#0050b8',
          700: '#0043a0',
          800: '#1e40af',
          900: '#1e3a8a',
          bright: '#0062E0',
          light: '#38BDF8',
          dark: '#0050B8',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}