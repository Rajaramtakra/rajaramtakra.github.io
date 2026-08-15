/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1140px', '2xl': '1280px' },
    },
    extend: {
      colors: {
        cream: { DEFAULT: '#f5ecdc', 100: '#fbf6ec', 200: '#f5ecdc', 300: '#ede0c8' },
        navy: { DEFAULT: '#333333', 700: '#1c3557', 800: '#152841', 900: '#0f1c30' },
        rust: { DEFAULT: '#b1502f', 600: '#c4653f', 700: '#9a4327' },
        maroon: { DEFAULT: '#6d2a1e', 700: '#5a2118' },
        gold: { DEFAULT: '#e2a83c', 600: '#cf9531' },
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(77, 158, 210, 0.25)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
