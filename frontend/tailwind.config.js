/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official ShrubHub Brand Colors from Visual Brand Guidelines v1.1
        forest: {
          DEFAULT: '#228B1B', // Deep Forest Green - Primary
        },
        leaf: {
          light: '#A6D856',  // Light Leaf Green
          dark: '#4BA83E',   // Deep Leaf Green
        },
        ocean: {
          deep: '#0A6F9C',   // Ocean Blue Deep - Secondary
          mid: '#2DA1C4',    // Ocean Blue Mid
          light: '#66CDE1',  // Ocean Blue Light
          mist: '#C5EEF4',   // Ocean Mist
        },
        coal: '#333333',     // Coal Grey - Text
        soft: '#F2F4F4',     // Soft Grey - Backgrounds
        // Status colors
        healthy: '#4BA83E',
        attention: '#E8A64F',
        urgent: '#E85A4F',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'elevation-1': '0 2px 8px rgba(0,0,0,0.06)',
        'elevation-2': '0 4px 12px rgba(0,0,0,0.08)',
        'elevation-3': '0 2px 12px rgba(0,0,0,0.04)',
        'elevation-4': '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
