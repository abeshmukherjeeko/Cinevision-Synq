import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: "#ffffff",
          sidebar: "#f7f7f5",
          hover: "#efefed",
          border: "#e6e6e3",
          text: "#37352f",
          muted: "#787774",
          accent: "#2383e2",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          '"Apple Color Emoji"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
