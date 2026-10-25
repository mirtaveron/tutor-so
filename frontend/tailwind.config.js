import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        }
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            'code': {
              backgroundColor: '#f1f5f9',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
              fontWeight: '600',
              color: '#0f172a',
            },
            'pre': {
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'inherit',
              fontWeight: '400',
            }
          }
        }
      }
    },
  },
  plugins: [
    typography,
  ],
}
