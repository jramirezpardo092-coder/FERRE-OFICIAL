import { SITE, CATEGORIES } from "./constants";
import { Product } from "./types";

export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/#business`,
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    telephone: `+57${SITE.phone1}`,
    email: SITE.email,
    image: `${SITE.url}/logo-ferreteria-pardo.png`,
    logo: `${SITE.url}/logo-ferreteria-pardo.png`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Calle 72 No. 50-23",
      addressLocality: "Bogotá",
      addressRegion: "Cundinamarca",
      postalCode: "111321",
      addressCountry: "CO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 4.667,
      longitude: -74.078,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:15",
        closes: "16:55",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:15",
        closes: "14:15",
      },
    ],
    sameAs: [SITE.social.instagram, SITE.social.facebook],
  };
}

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo-ferreteria-pardo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+57${SITE.phone1}`,
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
    sameAs: [SITE.social.instagram, SITE.social.facebook],
  };
}

export function getProductJsonLd(product: Product) {
  const slug = product.id;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nombre,
    image: product.img ? `${SITE.url}/${product.img}` : `${SITE.url}/logo-ferreteria-pardo.png`,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/producto/${slug}`,
      priceCurrency: "COP",
      price: product.precio,
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE.name,
      },
    },
  };
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/catalogo?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
