import type { ReactNode } from "react";
interface Props { children: ReactNode; className?: string; variant?: "up" | "left" | "scale"; stagger?: boolean; delay?: number; }
/** Conserva la composición existente sin animaciones decorativas ni contenido oculto. */
export default function ScrollReveal({ children, className = "" }: Props) { return <div className={className}>{children}</div>; }
