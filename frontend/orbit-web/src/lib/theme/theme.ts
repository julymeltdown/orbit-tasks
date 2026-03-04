const THEME_KEY = "orbit.theme";

export type ThemeMode = "light" | "dark";

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }
  const raw = localStorage.getItem(THEME_KEY);
  return raw === "dark" ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") {
    return;
  }
  if (mode === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem(THEME_KEY, mode);
}

export function toggleTheme(current?: ThemeMode): ThemeMode {
  const next = (current ?? readTheme()) === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
