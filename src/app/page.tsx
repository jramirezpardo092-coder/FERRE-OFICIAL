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
  // Filtrar en el servidor: solo los 8 destacados viajan al cliente
  const featured = products
    .filter((p) => p.disc && p.disc >= 15 && p.stock > 0)
    .sort((a, b) => (b.disc || 0) - (a.disc || 0))
    .slice(0, 8);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessJsonLd()) }}
      />
      <HeroCarousel />
      <ScrollReveal>
        <CategoryGrid />
      </ScrollReveal>
      <ScrollReveal>
        <FeaturedProducts products={featured} />
      </ScrollReveal>
      <ScrollReveal variant="scale">
        <InstagramSection />
      </ScrollReveal>
      <ScrollReveal>
        <BrandCarousel />
      </ScrollReveal>
      <ScrollReveal variant="left">
        <Testimonials />
      </ScrollReveal>
    </>
  );
}
