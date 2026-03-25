/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deep: {
          purple: '#1A1A6E',
          space: '#0A0A1E',
          dark: '#0f0f2d',
        },
        gold: '#FFD700',
        light: {
          gauge: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
