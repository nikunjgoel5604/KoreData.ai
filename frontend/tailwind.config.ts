import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        koreBg: "#030712",
        koreCard: "#111827",
        korePrimary: "#2563EB",
        koreSecondary: "#7C3AED",
        koreAccent: "#06B6D4"
      }
    }
  },
  plugins: []
};

export default config;
