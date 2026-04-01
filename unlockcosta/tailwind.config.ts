import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#243b53",
          900: "#1e3a5f",
          950: "#102a43",
        },
        gold: {
          50: "#fdf8ed",
          100: "#f9efd4",
          200: "#f3dca8",
          300: "#ecc472",
          400: "#c9a96e",
          500: "#b8944f",
          600: "#a37a3b",
          700: "#886032",
          800: "#714e2e",
          900: "#5f4129",
        },
      },
    },
  },
  plugins: [],
};
export default config;
