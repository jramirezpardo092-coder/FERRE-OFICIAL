import BrandStripes from "./BrandStripes";
import Link from "next/link";

export default function BrandCarousel({ brands }: { brands: string[] }) {
  return (
    <section id="marcas" className="home-section bg-surface  relative">
      <div className="absolute top-0 left-0 right-0 border-t border-line" />

      <div className="site-container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BrandStripes className="h-4 w-7" />
            <span className="text-xs font-bold text-brand-text uppercase tracking-[0.2em]">Marcas</span>
            <BrandStripes className="h-4 w-7" />
          </div>
          <h2 className="section-title">
            Marcas que nos respaldan
          </h2>
          <p className="section-subtitle mx-auto mt-4">
            Trabajamos con las mejores marcas del mercado ferretero
          </p>
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/catalogo?brand=${encodeURIComponent(brand)}`}
              className="bg-surface  rounded-card px-5 py-7 flex items-center justify-center border border-line  hover:border-brand hover:shadow-card   transition-all duration-200 group"
            >
              <span className="font-black text-base text-ink-2  group-hover:text-brand-text transition-colors duration-200 text-center">
                {brand}
              </span>
            </Link>
          ))}
        </div>

        {/* See all brands */}
        <div className="text-center mt-10">
          <Link
            href="/marcas"
            className="inline-flex min-h-11 items-center gap-2 text-ink font-bold text-sm hover:text-ink-2 transition-colors"
          >
            Ver todas las marcas
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
