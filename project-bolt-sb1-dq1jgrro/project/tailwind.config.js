/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'serif'],
      },
      colors: {
        night: {
          50: '#f4f6fa',
          100: '#e3e8f1',
          200: '#c3cddd',
          300: '#94a3bd',
          400: '#63738f',
          500: '#44526d',
          600: '#2f3b53',
          700: '#202a40',
          800: '#141c2e',
          900: '#0b1120',
          950: '#060a15',
        },
        gold: {
          100: '#fdf3d6',
          300: '#f5cf6b',
          400: '#eab549',
          500: '#d99a2b',
          600: '#b57a1c',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'banner-in': {
          '0%': { opacity: '0', transform: 'scale(1.15) translateY(-8px)', letterSpacing: '0.6em' },
          '18%': { opacity: '1', transform: 'scale(1) translateY(0)', letterSpacing: '0.2em' },
          '75%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1.02) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.12) translate3d(-1.5%,-1%,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(234,181,73,0.0)' },
          '50%': { boxShadow: '0 0 28px 4px rgba(234,181,73,0.45)' },
        },
        'tick-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'banner-in': 'banner-in 2.6s ease-in-out both',
        'ken-burns': 'ken-burns 24s ease-in-out infinite alternate',
        float: 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'tick-pulse': 'tick-pulse 1s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
        'card-flip': 'card-flip 0.6s ease-out both',
        'toast-in': 'toast-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
