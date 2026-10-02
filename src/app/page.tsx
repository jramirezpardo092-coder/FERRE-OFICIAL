import HeroCarousel from "@/components/HeroCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import InstagramSection from "@/components/InstagramSection";
import BrandCarousel from "@/components/BrandCarousel";
import Testimonials from "@/components/Testimonials";
import ScrollReveal from "@/components/ScrollReveal";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";
import { getLocalBusinessJsonLd } from "@/lib/seo";

export default function HomePage() {
  const products = productsData as Product[];
  // Una selección con disponibilidad de distintas categorías.
  const available = products.filter((p) => p.priceVerified === true && p.stock >= 1);
  const featured = Array.from(new Set(available.map((p) => p.cat)))
    .map((category) => available.find((p) => p.cat === category)!)
    .slice(0, 8);
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
