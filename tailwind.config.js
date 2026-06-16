/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f6f8",
          100: "#e7eaf0",
          200: "#c8cfdd",
          300: "#9aa7bf",
          400: "#65759a",
          500: "#445379",
          600: "#34405f",
          700: "#28324b",
          800: "#1c2336",
          900: "#11151f",
          950: "#080a10",
        },
        brass: {
          50: "#fbf7ed",
          100: "#f3e7c6",
          200: "#e7cf8c",
          300: "#dab455",
          400: "#cf9d31",
          500: "#b9842a",
          600: "#9a6724",
          700: "#7c4f23",
          800: "#684123",
          900: "#593821",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(207,157,49,0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(207,157,49,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(207,157,49,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-ring": "pulse-ring 1.6s infinite",
      },
    },
  },
  plugins: [],
};
