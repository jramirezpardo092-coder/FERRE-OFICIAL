import type { Config } from "tailwindcss";

// Names and values are documented in DESIGN.md. Components only consume roles.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const names = ["paper", "surface", "ink", "ink-2", "line", "control", "brand", "brand-press", "brand-text", "brand-tint", "on-brand", "on-ink", "ok", "warn", "muted", "wa", "wa-edge", "on-wa", "hero", "hero-ink", "hero-muted", "photo", "overlay"];
const config: Config = {
  darkMode: "class",
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors: { transparent: "transparent", current: "currentColor", inherit: "inherit", ...Object.fromEntries(names.map(name => [name, token(name)])) },
    fontSize: {
      xs: ["12px", "16px"], sm: ["14px", "20px"], base: ["16px", "24px"], lg: ["18px", "28px"], xl: ["22px", "28px"],
      "2xl": ["28px", "32px"], "3xl": ["40px", "44px"], "4xl": ["40px", "44px"], "5xl": ["56px", "56px"], "6xl": ["56px", "56px"],
    },
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      borderRadius: { control: "var(--radius-control)", card: "var(--radius-card)", chip: "var(--radius-chip)" },
      maxWidth: { site: "1280px", "7xl": "1280px" },
      boxShadow: { card: "0 2px 6px rgb(var(--overlay) / 0.06)" },
      transitionDuration: { DEFAULT: "180ms" },
      animation: { "count-pulse": "countPulse 180ms ease-out both" },
      keyframes: { countPulse: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.12)" } } },
    },
  },
  plugins: [],
};
export default config;
