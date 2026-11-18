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
        'page-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(.99)' },
          to: { opacity: '1', transform: 'none' },
        },
        'xp-float': {
          '0%': { opacity: '0', transform: 'translate(-50%, 10px) scale(.6)' },
          '15%': { opacity: '1', transform: 'translate(-50%, -6px) scale(1.15)' },
          '70%': { opacity: '1', transform: 'translate(-50%, -40px) scale(1)' },
          to: { opacity: '0', transform: 'translate(-50%, -70px) scale(.95)' },
        },
        'star-pop': {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-40deg)' },
          '60%': { opacity: '1', transform: 'scale(1.3) rotate(10deg)' },
          to: { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        'fab-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217,70,239,.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(217,70,239,0), 0 0 26px 4px rgba(217,70,239,.45)' },
        },
        glow: {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 2px #7dd3fc, 0 0 18px 4px rgba(56,189,248,.55), inset 0 0 14px rgba(186,230,253,.45)',
          },
          '50%': {
            transform: 'scale(1.035)',
            boxShadow: '0 0 0 2px #e0f2fe, 0 0 34px 10px rgba(56,189,248,.85), inset 0 0 22px rgba(224,242,254,.7)',
          },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
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
        glow: 'glow 1.8s ease-in-out infinite',
        'page-in': 'page-in .35s cubic-bezier(.2,.8,.2,1) both',
        'xp-float': 'xp-float 1.3s ease-out both',
        'star-pop': 'star-pop .55s cubic-bezier(.2,.9,.3,1.4) both',
        'fab-glow': 'fab-glow 2.4s ease-in-out infinite',
        'fade-up': 'fade-up .38s ease-out both',
        shake: 'shake .45s ease-in-out',
        pop: 'pop .5s ease-out both',
      },
    },
  },
  plugins: [],
};
