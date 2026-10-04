import Link from "next/link";
import ParditoPortrait from "@/components/catalog/ParditoPortrait";
import BrandStripes from "@/components/BrandStripes";
export default function NotFound() {
  return <div className="site-container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
    <div className="flex items-center gap-3 font-mono text-sm text-ink-2"><BrandStripes className="h-5 w-9" />404</div>
    <ParditoPortrait decorative className="my-4 h-[180px] w-[180px]" sizes="180px" />
    <h1 className="mb-3 text-2xl md:text-3xl">Por aquí no era. Te guío al catálogo.</h1>
    <p className="mb-8 max-w-md text-ink-2">Lo sentimos, la página que buscas no existe o fue movida.</p>
    <div className="flex flex-wrap justify-center gap-4"><Link href="/" className="btn-outline">Ir al inicio</Link><Link href="/catalogo" className="btn-primary">Ver catálogo</Link></div>
  </div>;
}
