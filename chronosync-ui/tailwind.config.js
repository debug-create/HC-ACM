/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F1117',
        'bg-secondary': '#161B22',
        'bg-tertiary': '#1C2128',
      }
    },
  },
  plugins: [],
}
