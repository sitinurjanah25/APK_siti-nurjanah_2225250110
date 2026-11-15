/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Kelas ini ada di CSS versi yang sudah dipublikasikan; dipertahankan agar hasil build sama.
  safelist: ['container', 'inline', '[x:5]', '[y:4]'],
  // Gaya dasar sudah diatur sendiri di src/index.css.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(.6)' },
          '30%': { opacity: '1', transform: 'translateY(-4px) scale(1.15)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .38s ease-out both',
        shake: 'shake .45s ease-in-out',
        pop: 'pop .5s ease-out both',
      },
    },
  },
  plugins: [],
};
