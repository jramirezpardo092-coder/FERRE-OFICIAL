import { SITE } from "./constants";
import type { Product } from "./types";
import { getUnitPriceWithTax, getAvailableQuantity } from "./utils";
import { displayBrand, normalizeProductName } from "./catalog/normalize";
import { getProductPath } from "./catalog/routes";

export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org", "@type": "HardwareStore", "@id": `${SITE.url}/#business`,
    name: SITE.name, description: `${SITE.description} Barrio 12 de Octubre. Domingos y festivos: cerrado.`,
    url: SITE.url, telephone: [`+57${SITE.phone1}`, `+57${SITE.phone2}`], email: SITE.email,
    image: `${SITE.url}/logo-ferreteria-pardo.png`, logo: `${SITE.url}/logo-ferreteria-pardo.png`, priceRange: "$$",
    address: { "@type": "PostalAddress", streetAddress: "Calle 72 No. 50-23, Barrio 12 de Octubre", addressLocality: "Bogotá", addressRegion: "Bogotá D.C.", addressCountry: "CO" },
    // Coordinates of this exact shop in its publicly listed Waze/Google place.
    geo: { "@type": "GeoCoordinates", latitude: 4.6681456, longitude: -74.074293 },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:15", closes: "16:55" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:15", closes: "14:15" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "00:00", closes: "00:00" },
    ],
    sameAs: [SITE.social.instagram, SITE.social.facebook], paymentAccepted: SITE.payments.join(", "), currenciesAccepted: "COP",
  };
}
export function getOrganizationJsonLd() {
  return { "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url,
    logo: `${SITE.url}/logo-ferreteria-pardo.png`, contactPoint: [SITE.phone1, SITE.phone2].map(phone => ({ "@type": "ContactPoint", telephone: `+57${phone}`, contactType: "customer service", availableLanguage: "Spanish" })),
    sameAs: [SITE.social.instagram, SITE.social.facebook] };
}
export function getProductJsonLd(product: Product) {
  const price = getUnitPriceWithTax(product);
  const brand = displayBrand(product.brand);
  const description = product.specs?.map(spec => `${spec.label}: ${spec.value}`).join(". ");
  return {
    "@context": "https://schema.org", "@type": "Product", "@id": `${SITE.url}${getProductPath(product)}#product`,
    name: normalizeProductName(product.nombre), sku: product.id,
    ...(product.img ? { image: `${SITE.url}/${product.img.replace(/^\//, "")}` } : {}),
    ...(description ? { description } : {}), ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(price !== null ? { offers: { "@type": "Offer", url: `${SITE.url}${getProductPath(product)}`, priceCurrency: "COP", price: Math.round(price),
      priceSpecification: { "@type": "PriceSpecification", priceCurrency: "COP", price: Math.round(price), valueAddedTaxIncluded: true },
      availability: getAvailableQuantity(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE.url}/#business` } } } : {}),
  };
}
export function getItemListJsonLd(products: Product[], offset = 0) {
  return { "@context": "https://schema.org", "@type": "ItemList", itemListElement: products.map((product, index) => ({
    "@type": "ListItem", position: offset + index + 1, name: normalizeProductName(product.nombre), url: `${SITE.url}${getProductPath(product)}`,
  })) };
}
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) };
}
export function getWebsiteJsonLd() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/catalogo?q={search_term_string}` }, "query-input": "required name=search_term_string" } };
}
