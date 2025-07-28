/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'mario-red': '#ff0000',
        'mario-blue': '#0099ff',
        'mario-yellow': '#ffff00',
        'mario-green': '#00cc00',
        'mario-brown': '#8b4513',
        'mario-orange': '#ff6600',
        'mario-pink': '#ff69b4',
        'mario-purple': '#9932cc',
        'mario-sky': '#87ceeb',
        'mario-cloud': '#f0f8ff',
        'mario-brick': '#cd5c5c',
        'mario-gold': '#ffd700',
        'mario-dark': '#2d1810',
        'mario-dirt': '#8b7355',
      },
      fontFamily: {
        'mario': ['Press Start 2P', 'Courier New', 'monospace'],
        'mario-text': ['VT323', 'Courier New', 'monospace'],
      },
      animation: {
        'bounce-mario': 'bounce-mario 0.5s ease-in-out',
        'coin-spin': 'coin-spin 1s linear infinite',
        'mario-jump': 'mario-jump 0.6s ease-out',
        'power-up': 'power-up 2s ease-in-out infinite',
        'block-hit': 'block-hit 0.3s ease-in-out',
        'star-twinkle': 'star-twinkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        'bounce-mario': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'coin-spin': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        'mario-jump': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'power-up': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.1)', filter: 'brightness(1.3)' },
        },
        'block-hit': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'star-twinkle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
} 