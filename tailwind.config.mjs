/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        jc: {
          black: '#231c2d',
          purple: '#2d2438',
          red: '#c84342',
          gold: '#D4A843',
          green: {
            light: '#55ac64',
            dark: '#1a2d19',
          },
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
