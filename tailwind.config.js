/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#228B1B',
        },
        leaf: {
          light: '#A6D856',
          dark: '#4BA83E',
        },
        ocean: {
          deep: '#0A6F9C',
          mid: '#2DA1C4',
          light: '#66CDE1',
          mist: '#C5EEF4',
        },
        coal: '#333333',
        soft: '#F2F4F4',
        border: '#E5E7EB',
        healthy: '#4BA83E',
        attention: '#E8A64F',
        urgent: '#E85A4F',
      },
      fontFamily: {
        sans: ['Roboto'],
      },
    },
  },
  plugins: [],
}
