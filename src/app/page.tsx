import HeroCarousel from "@/components/HeroCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import InstagramSection from "@/components/InstagramSection";
import BrandCarousel from "@/components/BrandCarousel";
import Testimonials from "@/components/Testimonials";
import ScrollReveal from "@/components/ScrollReveal";
import { getCatalogProducts, getFeaturedCatalogProducts } from "@/lib/catalog-service";
import { getLocalBusinessJsonLd } from "@/lib/seo";

export default function HomePage() {
  const products = getCatalogProducts();
  const featured = getFeaturedCatalogProducts();
  const brands = Array.from(new Set(products.map((p) => p.brand)))
    .filter((brand) => brand && brand !== "Sin marca").sort();

  // Conteo por categoría en el servidor: el catálogo completo no viaja al cliente
  const categoryCounts: Record<string, number> = {};
  products.forEach((p) => {
    categoryCounts[p.cat] = (categoryCounts[p.cat] || 0) + 1;
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessJsonLd()) }}
      />
      <HeroCarousel
        productCount={products.length}
        brandCount={brands.length}
        categoryCount={Object.keys(categoryCounts).length}
      />
      <ScrollReveal>
        <CategoryGrid counts={categoryCounts} />
      </ScrollReveal>
      <ScrollReveal>
        <FeaturedProducts products={featured} />
      </ScrollReveal>
      <ScrollReveal variant="scale">
        <InstagramSection />
      </ScrollReveal>
      <ScrollReveal>
        <BrandCarousel brands={brands} />
      </ScrollReveal>
      <ScrollReveal variant="left">
        <Testimonials />
      </ScrollReveal>
    </>
  );
}
