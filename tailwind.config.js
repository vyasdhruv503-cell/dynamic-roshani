/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.html",
    "./*.js",
    "./assets/js/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brandBlue:  '#0291D7',
        brandGreen: '#aab851',
        brandTeal:  '#56A194',
        darkBg:     '#0F172A',
        darkCard:   '#1E293B',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
