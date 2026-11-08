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
        primary: {
          DEFAULT: "#1E3A8A", // Deep Navy LMS
          hover: "#172554",
          light: "#1D4ED8",
        },
        brand: {
          accent: "#3B82F6",
          sky: "#0284C7",
        },
        alert: {
          surface: "#FEF08A",
          border: "#FDE047",
          pill: "#FEF3C7",
          text: "#B45309",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      transitionTimingFunction: {
        "ease-out-custom": "cubic-bezier(0.23, 1, 0.32, 1)",
        "ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        dropdownEnter: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "dropdown-enter": "dropdownEnter 160ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
