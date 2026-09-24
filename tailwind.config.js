/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './{components,packs,state}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Soft "concrete" light theme: nothing brighter than ~97% white, to cut glare.
      colors: {
        canvas: '#dfe3e8', // page background
        surface: '#eceff2', // cards and panels
        raised: '#f5f7f9', // inputs, active pills, hover
        line: '#c9d0d7', // borders
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
