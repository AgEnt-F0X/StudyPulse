/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface tokens (Botanical Scholar locked)
        surface: '#0a120e',
        'bg-primary': 'var(--bg-primary)',
        'bg-card': 'var(--bg-card)',
        surface_bright: '#101c17',
        surface_container_lowest: '#080f0c',
        surface_container_low: '#0d1712',
        surface_container: '#101c17',
        surface_container_high: '#14231c',
        surface_container_highest: '#182b22',
        surface_variant: '#182b22',
        outline: '#769989',
        outline_variant: 'rgba(52,211,153,0.14)',
        on_surface: '#f0fdf4',
        on_surface_variant: '#a7c4b5',
        on_background: '#f0fdf4',
        on_surface_inverse: '#0a120e',

        // Accent tokens — Emerald action + Brass reward
        primary: '#10b981',
        primary_container: '#059669',
        primary_dim: '#34d399',
        secondary: '#f59e0b',
        secondary_container: '#d97706',
        tertiary: '#c084fc',
        tertiary_container: '#a855f7',
        tertiary_variant: '#c58aff',
        inverse_surface: '#14231c',
        inverse_primary: '#059669',

        // Semantic
        error: '#f87171',
        success: '#34d399',
      },

      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },

      borderRadius: {
        'none': '0',
        'xs': '4px',
        'sm': '8px',
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '16px',
      },

      boxShadow: {
        'ambient': '0 32px 64px rgba(0,0,0,0.25)',
        'ambient-lg': '0 48px 96px rgba(0,0,0,0.35)',
        'ambient-sm': '0 8px 32px rgba(0,0,0,0.25)',
        'primary': '0 8px 32px rgba(16,185,129,0.22)',
        'secondary': '0 8px 32px rgba(245,158,11,0.22)',
        'tertiary': '0 8px 32px rgba(192,132,252,0.15)',
        'inner': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'ghost': '0 2px 8px rgba(0,0,0,0.2)',
      },

      backdropBlur: {
        'glass': '20px',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
