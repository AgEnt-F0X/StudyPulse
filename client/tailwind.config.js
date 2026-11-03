/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Spatial workspace: warm travertine canvas + botanical glass ──
        travertine: {
          100: '#F7F3EC',
          200: '#F4F0EA',
          300: '#EDE7DC',
          400: '#E6DFD5',
          500: '#D8CFC0',
        },
        glass: {
          base: '#121D18',
          raised: '#14201B',
          active: '#1E352B',
        },
        champagne: {
          DEFAULT: '#D4C3A3',
          dim: 'rgba(212, 195, 163, 0.28)',
          faint: 'rgba(212, 195, 163, 0.14)',
        },
        cream: '#F4F0EA',
        ink: '#232019',
        paper: '#FAF7F2',

        // Emerald / amber action
        primary: '#10B981',
        primary_dim: '#34D399',
        primary_bright: '#6EE7B7',
        secondary: '#F59E0B',
        secondary_container: '#D97706',
        gold: '#D4C3A3',

        // Semantic
        error: '#EF4444',
        success: '#34D399',
      },

      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
        hand: ['Caveat', '"Segoe Print"', 'cursive'],
      },

      borderRadius: {
        'none': '0',
        'xs': '4px',
        'sm': '6px',
        'DEFAULT': '10px',
        'md': '12px',
        'lg': '18px',
        'xl': '24px',
      },

      boxShadow: {
        // Glass panel on warm canvas
        'panel': '0 20px 50px rgba(30, 25, 15, 0.3), 0 2px 8px rgba(30, 25, 15, 0.18)',
        'panel-sm': '0 10px 28px rgba(30, 25, 15, 0.22)',
        'dock': '0 20px 50px rgba(10, 14, 10, 0.45)',
        'book': '0 24px 40px rgba(30, 25, 15, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.4)',
        'lip': '0 4px 0 rgba(0, 0, 0, 0.35), 0 8px 16px rgba(0, 0, 0, 0.15)',
        'horizon': '0 -40px 120px rgba(212, 195, 163, 0.12)',
      },

      backdropBlur: {
        'glass': '24px',
        'glass-xl': '40px',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'ecg': {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
        'led-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'ecg': 'ecg 2.4s linear infinite',
        'led-pulse': 'led-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
