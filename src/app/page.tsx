import HeroCarousel from "@/components/HeroCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import InstagramSection from "@/components/InstagramSection";
import BrandCarousel from "@/components/BrandCarousel";
import Testimonials from "@/components/Testimonials";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";

export default function HomePage() {
  const products = productsData as Product[];

  return (
    <>
      <HeroCarousel />
      <CategoryGrid />
      <FeaturedProducts products={products} />
      <InstagramSection />
      <BrandCarousel />
      <Testimonials />
    </>
  );
}
