import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'instrument-serif': ['Instrument Serif', 'serif'],
      },
      colors: {
        brand: {
          1: '#7b39fc',
          2: '#8B5CF6',
          3: '#A78BFA',
          4: '#C4B5FD',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        surface: 'var(--surface)',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7b39fc 0%, #a78bfa 100%)',
        'brand-gradient-h': 'linear-gradient(90deg, #7b39fc 0%, #a78bfa 100%)',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.2)',
        'glass-hover': '0 10px 36px rgba(0,0,0,0.3)',
        'navbar': '0 8px 32px rgba(0,0,0,0.2)',
        'metric': '0 2px 12px rgba(0,0,0,0.15)',
        'metric-hover': '0 10px 32px rgba(0,0,0,0.25)',
        'sidebar': '4px 0 24px rgba(0,0,0,0.2)',
      },
      keyframes: {
        'float-1': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-3': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'float-1': 'float-1 4s ease-in-out infinite',
        'float-2': 'float-2 5s ease-in-out infinite 0.5s',
        'float-3': 'float-3 4.5s ease-in-out infinite 1s',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        'slide-left': 'slide-left 30s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
