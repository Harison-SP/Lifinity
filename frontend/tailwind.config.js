/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        'primary-light': '#fb923c',
        'background-light': '#f8f6f6',
        alabaster: '#fcfaf8',
        charcoal: '#4a443e',
        taupe: '#9a9086',
        sage: '#8c9a81',
        terracotta: '#c27a65',
        sand: '#f4efea',
        'sand-dark': '#e8e0d8',
      },
      fontFamily: {
        display: ['Newsreader', 'serif'],
        heading: ['Libre Baskerville', 'serif'],
        body: ['Cabin', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.5rem',
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        gentle: '0 4px 20px rgba(74, 68, 62, 0.05)',
        'gentle-lg': '0 8px 30px rgba(74, 68, 62, 0.08)',
        'soft': '0 2px 8px rgba(74, 68, 62, 0.08)',
      },
    },
  },
  plugins: [],
}
