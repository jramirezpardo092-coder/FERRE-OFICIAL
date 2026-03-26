import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-extrabold text-brand-red mb-4">404</div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
        Página no encontrada
      </h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Lo sentimos, la página que buscas no existe o fue movida.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-8 py-3 bg-brand-red text-white font-semibold rounded-2xl hover:bg-brand-red-dark transition-all"
        >
          Ir al inicio
        </Link>
        <Link
          href="/catalogo"
          className="px-8 py-3 border-2 border-brand-red text-brand-red font-semibold rounded-2xl hover:bg-brand-red hover:text-white transition-all"
        >
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
