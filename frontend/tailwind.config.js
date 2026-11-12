/** @type {import('tailwindcss').Config} */
// Configuration Tailwind CSS du projet COMPTALINK
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Charte graphique COMPTALINK
        nuit: '#1E3A5F',
        bleu: '#2E86AB',
        orange: '#F18F01',
        grisclair: '#F4F6F9',
        gris: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(30, 58, 95, 0.10), 0 1px 2px rgba(30, 58, 95, 0.06)',
      },
    },
  },
  plugins: [],
};
