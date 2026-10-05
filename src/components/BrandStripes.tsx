/** Tres trazos a 60°: acento editorial derivado del logo, nunca contenido. */
export default function BrandStripes({ className = "h-8 w-14" }: { className?: string }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 64 36" className={`brand-stripes ${className}`} fill="none">
    <path d="M3 34 22 2M23 34 42 2M43 34 62 2" stroke="currentColor" strokeWidth="3" />
  </svg>;
}
