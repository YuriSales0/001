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
        hm: {
          navy:       '#0B1E3A',
          gold:       '#B08A3E',
          cream:      '#F6F2EA',
          paper:      '#FBF9F4',
          'cream-dark': '#EAE3D4',
          stone:      '#C7BFAF',
          ink:        '#0A0A0A',
          'navy-deep':  '#071328',
          'navy-2':     '#142B4D',
          'navy-3':     '#1F3A66',
          'gold-light': '#C9A255',
          'gold-dark':  '#8B6B2A',
          green:      '#1B7A4A',
          red:        '#B91C1C',
        },
        /* Legacy — kept for transition */
        navy: {
          50:  "#f0f4f8", 100: "#d9e2ec", 200: "#bcccdc", 300: "#9fb3c8",
          400: "#829ab1", 500: "#627d98", 600: "#486581", 700: "#334e68",
          800: "#243b53", 900: "#0B1E3A", 950: "#071328",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter-tight)", "Inter Tight", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
      },
      borderRadius: {
        hm: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
