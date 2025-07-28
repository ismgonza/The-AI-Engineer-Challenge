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
        'terminal-green': '#00ff00',
        'terminal-dark': '#0a0a0a',
        'terminal-gray': '#1a1a1a',
        'terminal-light-gray': '#2a2a2a',
        'terminal-blue': '#00ffff',
        'terminal-yellow': '#ffff00',
        'terminal-red': '#ff0000',
        'terminal-purple': '#ff00ff',
      },
      fontFamily: {
        'mono': ['Courier New', 'Courier', 'monospace'],
        'terminal': ['Courier New', 'Courier', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00' },
          '100%': { textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
} 