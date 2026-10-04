"use client";
import { useTheme } from "./ThemeProvider";
/** Glifo de 20 px dentro de un objetivo táctil de al menos 44 px. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button type="button" onClick={toggle} aria-label="Cambiar tema" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-hero-muted px-3 text-sm font-semibold text-hero-ink transition-colors hover:bg-hero-ink/10">
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      {theme === "dark" ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></> : <path d="M20.35 15.35A9 9 0 0 1 8.65 3.65 9 9 0 1 0 20.35 15.35Z"/>}
    </svg>{theme === "dark" ? "Modo claro" : "Modo oscuro"}
  </button>;
}
