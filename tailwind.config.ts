import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12181f",
        paper: "#faf9f6",
        accent: {
          DEFAULT: "#0b3d2e",
          light: "#12523d",
          dark: "#082a20",
        },
        border: "#e2e0da",
        navy: {
          DEFAULT: "#0f2540",
          deep: "#0a1a2e",
        },
        gold: {
          DEFAULT: "#c9a24b",
          light: "#e8cf8f",
          dark: "#96742c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
