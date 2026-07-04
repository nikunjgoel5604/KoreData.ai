import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        kore: {
          bg: "var(--bg)",
          bg2: "var(--bg-2)",
          surface: "var(--surface)",
          surface2: "var(--surface-2)",
          panel: "var(--panel-bg)",
          panelSoft: "var(--panel-soft)",
          panelStrong: "var(--panel-strong)",
          navBg: "var(--nav-bg)",
          border: "var(--border)",
          borderStrong: "var(--border-strong)",
          accent: "var(--accent)",
          accent2: "var(--accent-2)",
          violet: "var(--violet)",
          blue: "var(--blue)",
          text: "var(--text)",
          muted: "var(--muted)",
          dim: "var(--dim)",
          danger: "var(--danger)",
          gridLine: "var(--grid-line)",
        },
      },
      fontFamily: {
        display: ["Syne", "Arial", "sans-serif"],
        body: ["DM Sans", "Arial", "sans-serif"],
        mono: ["DM Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        kore: "var(--radius)",
      },
      spacing: {
        navH: "var(--nav-h)",
      },
      animation: {
        scan: "scan 5s linear infinite",
        pulse: "pulse 1.6s ease-in-out infinite",
        orbGlow: "orbGlow 4s ease-in-out infinite",
        cardReveal: "cardReveal 0.7s ease both",
        cardSweep: "cardSweep 1.1s ease forwards",
        gridMove: "gridMove 3s linear infinite",
        displayLight: "displayLightMove 10s ease-in-out infinite",
        dashboardPulse: "dashboardLightPulse 4.8s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          from: { backgroundPosition: "220% 0" },
          to: { backgroundPosition: "-220% 0" },
        },
        pulse: {
          "50%": { opacity: "0.25", transform: "scale(0.7)" },
        },
        orbGlow: {
          "0%, 100%": { opacity: "0.7", transform: "scale(0.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        cardReveal: {
          from: { opacity: "0", transform: "translateY(24px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        cardSweep: {
          from: { transform: "translateX(-120%)" },
          to: { transform: "translateX(120%)" },
        },
        gridMove: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "48px 48px" },
        },
        displayLightMove: {
          "0%, 100%": {
            transform: "translate3d(0,0,0) scale(1)",
            opacity: "0.78",
          },
          "50%": {
            transform: "translate3d(-2%,1.5%,0) scale(1.04)",
            opacity: "1",
          },
        },
        dashboardLightPulse: {
          "0%, 100%": { opacity: "0.66", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
