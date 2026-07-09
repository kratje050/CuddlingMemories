/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F1EA",
        linen: "#E9DCCF",
        blush: "#D8C1AA",
        clay: "#B79D86",
        cocoa: "#8A6B55",
        coffee: "#4E3B2F",
        card: "#FFF9F3",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        script: ['"Oooh Baby"', "cursive"],
        sans: ['"Montserrat"', "Arial", "sans-serif"],
        heroTitle: ['"Cutive Mono"', "monospace"],
      },
      boxShadow: {
        soft: "0 18px 55px rgba(78, 59, 47, 0.12)",
        glow: "0 12px 35px rgba(183, 157, 134, 0.25)",
      },
      animation: {
        floatIn: "floatIn 700ms ease both",
        fadeUp: "fadeUp 650ms ease both",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
