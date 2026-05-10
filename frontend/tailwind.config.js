const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#c2703a",
            foreground: "#ffffff",
            50: "#fdf5ee",
            100: "#fae5d0",
            200: "#f5cba0",
            300: "#edab6a",
            400: "#e08840",
            500: "#c2703a",
            600: "#a85a2d",
            700: "#8c4625",
            800: "#71341e",
            900: "#5a2819",
          },
          background: "#f9f6f1",
          foreground: "#3d2f20",
        },
      },
      dark: {
        colors: {
          primary: {
            DEFAULT: "#d4854d",
            foreground: "#1e1510",
            50: "#fdf5ee",
            100: "#fae5d0",
            200: "#f5cba0",
            300: "#edab6a",
            400: "#e08840",
            500: "#d4854d",
            600: "#a85a2d",
            700: "#8c4625",
            800: "#71341e",
            900: "#5a2819",
          },
          background: "#1e1b16",
          foreground: "#f0ede8",
        },
      },
    },
  })],
};
