import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // toggled by adding/removing "dark" class on <html>, see lib/theme.ts
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Central place for brand colors. Keeping these named (instead of
        // sprinkling hex codes through components) makes it a one-line change
        // to re-theme the whole site later.
        brand: {
          50: "#f4f7fb",
          100: "#e3ecf7",
          500: "#3d6fb4",
          600: "#2f5a96",
          700: "#274a7a",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
