/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        navy: '#0F1B2D',
        page: '#F5F7FA',
        primary: '#2563EB',
        ok: '#16A34A',
        warn: '#D97706',
        risk: '#DC2626',
      },
      borderRadius: { card: '12px' },
      boxShadow: { card: '0 1px 2px rgba(15,27,45,0.06), 0 2px 8px rgba(15,27,45,0.05)' },
    },
  },
  plugins: [],
};
