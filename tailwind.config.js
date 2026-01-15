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
        dark: {
          bg: '#050505',
          card: '#0a0a0a',
        },
        light: {
          bg: '#f5f5f4',
          card: '#e7e5e4',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      backdropBlur: {
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
