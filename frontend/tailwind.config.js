/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Pink and Blue Theme
        // One accent (brand). Legacy primary/secondary/accent names alias to it so
        // older pages stay on-palette. White on brand-600 = 6.04:1.
        brand: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          600: '#BE185D',
          700: '#9D174D',
        },
        danger: { 50: '#FEF2F2', 600: '#B91C1C', 700: '#991B1B' },
        primary: { pink: '#BE185D', blue: '#BE185D' },
        secondary: { pink: '#9D174D', blue: '#9D174D' },
        accent: { pink: '#FCE7F3', blue: '#FCE7F3' },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        }
      },
      // Type scale: 5 sizes. Use these in new code.
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1rem' }],
        small: ['0.875rem', { lineHeight: '1.25rem' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        title: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        display: ['1.75rem', { lineHeight: '2rem', fontWeight: '700' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

