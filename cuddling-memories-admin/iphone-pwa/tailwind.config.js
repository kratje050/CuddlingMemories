/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
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
      boxShadow: {
        soft: "0 18px 55px rgba(78, 59, 47, 0.12)",
      },
    },
  },
  plugins: [],
};
