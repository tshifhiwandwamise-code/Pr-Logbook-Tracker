import type { Config } from "tailwindcss";

// Design tokens per claude.md §17.7. Dark + light themes, semantic colours,
// 8px spacing scale, Inter + JetBrains Mono.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme (default) values; light theme overrides applied via CSS variables in globals.css
        background: "var(--background)",
        surface: "var(--surface)",
        card: "var(--card)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "accent-blue": "var(--accent-blue)",
        "accent-green": "var(--accent-green)",
        "accent-amber": "var(--accent-amber)",
        "accent-red": "var(--accent-red)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      spacing: {
        // 8px base scale already covered by Tailwind defaults; just expose tap-target sizes
        "tap": "44px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
