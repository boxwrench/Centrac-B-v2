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
        canvas: '#d5dae0', // page background
        surface: '#e3e7eb', // cards and panels
        raised: '#eceff2', // inputs, active pills, hover
        line: '#bec6ce', // borders
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
