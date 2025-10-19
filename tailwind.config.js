/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer-kf 3s linear infinite",
        shiny: "shimmer-kf 1.2s linear infinite",
        "spin-around": "spin-around calc(var(--speed) * 2) linear infinite",
        grid: "grid 150s linear infinite",
        "background-position-spin":
          "background-position-spin 3s linear infinite",
      },
      keyframes: {
        "shimmer-kf": {
          from: { "background-position": "200% 0" },
          to: { "background-position": "-200% 0" },
        },
        "spin-around": {
          "0%": { transform: "translateZ(0) rotate(0)" },
          "15%, 35%": { transform: "translateZ(0) rotate(90deg)" },
          "65%, 85%": { transform: "translateZ(0) rotate(270deg)" },
          "100%": { transform: "translateZ(0) rotate(360deg)" },
        },
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
        "background-position-spin": {
          "0%": { "background-position": "0% 0%" },
          "100%": { "background-position": "200% 0%" },
        },
      },
    },
  },
  plugins: [],
};
