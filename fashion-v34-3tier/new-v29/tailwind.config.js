/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#f5f0ff', 500:'#8b5cf6', 900:'#1e1048' }
      }
    }
  },
  plugins: [],
}
