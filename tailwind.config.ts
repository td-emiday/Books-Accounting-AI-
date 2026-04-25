import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'instrument-serif': ['Instrument Serif', 'serif'],
      },
      colors: {
        brand: {
          1: '#4F46E5',
          2: '#6366F1',
          3: '#818CF8',
          4: '#C7D2FE',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        border: 'hsl(var(--border-shadcn))',
        input: 'hsl(var(--input-shadcn))',
        ring: 'hsl(var(--ring-shadcn))',
        background: 'hsl(var(--background-shadcn))',
        foreground: 'hsl(var(--foreground-shadcn))',
        primary: {
          DEFAULT: 'hsl(var(--primary-shadcn))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary-shadcn))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive-shadcn))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted-shadcn))',
          foreground: 'hsl(var(--muted-foreground-shadcn))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent-shadcn))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover-shadcn))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card-shadcn))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '16px',
        '3xl': '20px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
        'brand-gradient-h': 'linear-gradient(90deg, #4F46E5 0%, #818CF8 100%)',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'glass': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'navbar': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'metric': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'metric-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'sidebar': '1px 0 3px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        'border-beam': {
          '100%': { 'offset-distance': '100%' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
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
        'shimmer': {
          '0%': { transform: 'translateX(-100%) skewX(-20deg)' },
          '100%': { transform: 'translateX(300%) skewX(-20deg)' },
        },
      },
      animation: {
        'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float-1': 'float-1 4s ease-in-out infinite',
        'float-2': 'float-2 5s ease-in-out infinite 0.5s',
        'float-3': 'float-3 4.5s ease-in-out infinite 1s',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        'slide-left': 'slide-left 30s linear infinite',
        'shimmer': 'shimmer 6s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
