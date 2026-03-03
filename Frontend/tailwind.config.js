export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tealbrand: {
          950: "#012a2a",
          900: "#013f3f",
          800: "#015a5a",
          700: "#017878",
          600: "#029090",
          500: "#0bb5b5",
          400: "#22d3d3",
          300: "#5ee8e8",
          200: "#9ff5f5",
          100: "#d0fafa",
          50: "#ecfefe",
        },
        bgdark: "#020f0f",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};