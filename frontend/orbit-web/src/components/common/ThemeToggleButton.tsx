import { useState } from "react";
import { readTheme, toggleTheme } from "@/lib/theme/theme";

type Variant = "public" | "shell";

interface ThemeToggleButtonProps {
  variant?: Variant;
}

export function ThemeToggleButton({ variant = "public" }: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState(readTheme());

  function onToggle() {
    const next = toggleTheme(theme);
    setTheme(next);
  }

  const label = theme === "dark" ? "Light" : "Dark";
  const className = variant === "shell" ? "orbit-button orbit-button--ghost" : "orbit-link-button";

  return (
    <button className={className} type="button" onClick={onToggle} aria-label={`${label} mode`}>
      {label}
    </button>
  );
}
