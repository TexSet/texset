import type { Config } from "tailwindcss";

// colors are driven by CSS variables defined in globals.css. the channels are
// stored as raw "R G B" triples so tailwind can still apply opacity modifiers
// like bg-accent/20. the accent swaps per document engine (green for LaTeX,
// blue for Typst later) just by changing the variable on a parent element.
function withAlpha(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: withAlpha("--color-bg"),
        surface: withAlpha("--color-surface"),
        "surface-2": withAlpha("--color-surface-2"),
        border: withAlpha("--color-border"),
        text: {
          DEFAULT: withAlpha("--color-text"),
          muted: withAlpha("--color-text-muted"),
        },
        accent: {
          DEFAULT: withAlpha("--color-accent"),
          fg: withAlpha("--color-accent-fg"),
          soft: withAlpha("--color-accent-soft"),
        },
        danger: withAlpha("--color-danger"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.06)",
        lift: "0 8px 30px rgb(0 0 0 / 0.10)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
