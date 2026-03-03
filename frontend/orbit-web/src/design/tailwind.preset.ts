import type { Config } from "tailwindcss";

const preset: Config = {
  content: [],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        orbit: {
          bg: "var(--orbit-bg)",
          surface1: "var(--orbit-surface-1)",
          surface2: "var(--orbit-surface-2)",
          surface3: "var(--orbit-surface-3)",
          text: "var(--orbit-text)",
          subtle: "var(--orbit-text-subtle)",
          border: "var(--orbit-border)",
          accent: "var(--orbit-accent)",
          accent2: "var(--orbit-accent-2)",
          glow: "var(--orbit-accent-glow)",
          danger: "var(--orbit-danger)",
          success: "var(--orbit-success)"
        }
      },
      borderRadius: {
        none: "0"
      },
      boxShadow: {
        orbit1: "var(--orbit-shadow-1)",
        orbit2: "var(--orbit-shadow-2)"
      }
    }
  }
};

export default preset;
