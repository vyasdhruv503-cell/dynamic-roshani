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
        // Modern Tech Academy Color Palette
        brandBlue:  '#2563EB', // Electric/Royal Blue
        brandPurple: '#7C3AED', // Vibrant Academy Purple
        brandMint:   '#10B981', // Clean Tech Mint/Emerald
        brandTeal:   '#0D9488', // Deep Modern Teal
        brandGreen:  '#10B981', // Alias for backward compatibility
        darkBg:      '#0F172A', // Deep Slate
        darkCard:    '#1E293B', // Dark Card Surface
        darkBorder:  '#334155', // Sleek Border
        eduLightBg:  '#F8FAFC', // Crisp Slate Soft White
        eduLightCard: '#FFFFFF', // Clean White Card
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'edu-sm': '0 2px 8px -2px rgba(37, 99, 235, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'edu-md': '0 8px 24px -4px rgba(37, 99, 235, 0.12), 0 4px 12px -2px rgba(124, 58, 237, 0.06)',
        'edu-lg': '0 16px 36px -6px rgba(37, 99, 235, 0.18), 0 8px 20px -4px rgba(16, 185, 129, 0.12)',
        'edu-glow': '0 0 25px rgba(37, 99, 235, 0.35)',
        'purple-glow': '0 0 25px rgba(124, 58, 237, 0.35)',
        'mint-glow': '0 0 25px rgba(16, 185, 129, 0.35)',
      },
      backgroundImage: {
        'edu-gradient': 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        'edu-gradient-accent': 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
        'edu-hero': 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 50%, #0284C7 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
        'glass-dark-gradient': 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.7) 100%)',
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
