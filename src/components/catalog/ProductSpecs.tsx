import type { ProductSpec } from "@/lib/types";

interface Props {
  specs?: ProductSpec[];
  limit?: number;
}

export default function ProductSpecs({ specs, limit = 2 }: Props) {
  // No extraemos medidas del nombre: solo mostramos datos comprobados en la fuente.
  const visible = (specs ?? [])
    .filter((spec) => spec.verified === true && spec.label.trim() && spec.value.trim())
    .slice(0, Math.max(0, limit));
  if (!visible.length) return null;

  return (
    <dl className="mt-3 space-y-1 text-[13px] text-gray-600 dark:text-gray-300">
      {visible.map((spec, index) => (
        <div key={`${spec.label}-${index}`} className="flex gap-1.5 leading-relaxed">
          <dt className="shrink-0 font-medium">{spec.label}:</dt>
          <dd className="min-w-0 break-words">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
