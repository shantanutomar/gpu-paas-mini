/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        'dark-bg': '#0f0f1e',
        'dark-surface': '#1a1a2e',
        'dark-surface-hover': '#2a2a3e',
        'dark-border': '#333',
        'primary': '#6c63ff',
        'primary-hover': '#5a52d5',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
