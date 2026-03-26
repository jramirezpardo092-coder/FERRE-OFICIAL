import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Ferretería Pardo SAS",
  description: "Tips, guías y novedades del mundo ferretero.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🛠️</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Blog en construcción
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
          Pronto encontrarás aquí tips, guías de compra y novedades del mundo ferretero.
        </p>
        <Link href="/" className="btn-primary">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
