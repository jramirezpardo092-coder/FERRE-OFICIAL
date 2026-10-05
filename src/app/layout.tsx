import type { Metadata } from "next";
import "./globals.css";
import "./quote-visual.css";
import "@/components/catalog/product-visual.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MiniCart from "@/components/MiniCart";
import ThemeProvider from "@/components/ThemeProvider";
import { getLocalBusinessJsonLd, getWebsiteJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import productsData from "@/data/products.json";

const catalogCount = productsData.length.toLocaleString("es-CO");

export const metadata: Metadata = {
  title: "Ferretería Pardo SAS | Catálogo, herrajes y herramientas en Bogotá",
  description:
    `Ferretería Pardo SAS: herrajes, cerrajería, herramientas y asesoría ferretera en Bogotá. ${catalogCount} productos en catálogo. Cotiza directo por WhatsApp.`,
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: "website",
    title: `Ferretería Pardo SAS | ${catalogCount} productos ferreteros en Bogotá`,
    description:
      "Herrajes, cerrajería, herramientas y tornillería. 60+ años de experiencia. Cotiza directo por WhatsApp.",
    images: ["/logo-ferreteria-pardo.png"],
    siteName: "Ferretería Pardo SAS",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ferretería Pardo SAS | Catálogo Ferretero en Bogotá",
    description:
      `${catalogCount} productos de herrajes, cerrajería y herramientas. Cotiza por WhatsApp.`,
    images: ["/logo-ferreteria-pardo.png"],
  },
  robots: "index, follow",
  authors: [{ name: "Ferretería Pardo SAS" }],
  icons: {
    icon: "/logo-ferreteria-pardo.png",
    apple: "/logo-ferreteria-pardo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Aplica la preferencia antes del primer pintado para evitar un destello claro. */}
        <script dangerouslySetInnerHTML={{ __html: `(()=>{let t;try{t=localStorage.getItem("theme")}catch{}document.documentElement.classList.toggle("dark",t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))})()` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessJsonLd()).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteJsonLd()) }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-control focus:bg-surface focus:text-ink focus:p-4">Saltar al contenido</a>
        <ThemeProvider>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <MiniCart />
        </ThemeProvider>
      </body>
    </html>
  );
}
