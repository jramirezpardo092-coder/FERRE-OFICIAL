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
        <FeaturedProducts products={products} />
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
