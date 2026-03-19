/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        'mobile': '480px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1280px',
      },
      colors: {
        // Theme-aware colors using CSS variables
        background: 'var(--theme-background)',
        surface: 'var(--theme-surface)',
        'surface-elevated': 'var(--theme-surface-elevated)',
        
        // Theme Primary Colors
        primary: 'var(--theme-primary)',
        'primary-dark': 'var(--theme-primary-dark)',
        'primary-glow': 'var(--theme-primary-glow)',
        
        // Theme Accent Colors
        accent: 'var(--theme-accent)',
        'accent-dark': 'var(--theme-accent-dark)',
        'accent-glow': 'var(--theme-accent-glow)',
        
        // Theme Highlight/CTA
        highlight: 'var(--theme-highlight)',
        'highlight-dark': 'var(--theme-highlight-dark)',
        'highlight-glow': 'var(--theme-highlight-glow)',
        
        // Legacy colors (mapped to theme)
        secondary: 'var(--theme-highlight)',
        'secondary-dark': 'var(--theme-highlight-dark)',
        success: 'var(--theme-highlight)',
        error: 'var(--theme-primary)',
        warning: 'var(--theme-highlight)',
        
        // Text colors
        'text-primary': 'var(--theme-text-primary)',
        'text-secondary': 'var(--theme-text-secondary)',
      },
      fontFamily: {
        display: ['var(--theme-font-display)', 'sans-serif'],
        body: ['var(--theme-font-body)', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': 'var(--theme-border-radius)',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'btn': 'var(--theme-btn-shadow)',
        'btn-hover': 'var(--theme-btn-shadow-hover)',
        'card': 'var(--theme-card-shadow)',
        'glow-primary': 'var(--theme-glow-primary)',
        'glow-accent': 'var(--theme-glow-accent)',
        'glow-highlight': 'var(--theme-glow-highlight)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-fast': 'pulse-fast 0.5s ease-in-out infinite',
        'scan': 'scan 3s linear infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--theme-primary)' },
          '50%': { boxShadow: '0 0 20px 10px transparent' },
        },
        'pulse-fast': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'scan': {
          'from': { top: '10%' },
          'to': { top: '90%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
      },
    },
  },
  plugins: [],
}
