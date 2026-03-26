import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MiniCart from "@/components/MiniCart";
import { getOrganizationJsonLd, getWebsiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Ferretería Pardo SAS | Catálogo, herrajes y herramientas en Bogotá",
  description:
    "Ferretería Pardo SAS: herrajes, cerrajería, herramientas y asesoría ferretera en Bogotá. 5.000+ productos. Cotiza directo por WhatsApp.",
  metadataBase: new URL("https://ferre-oficial.vercel.app"),
  openGraph: {
    type: "website",
    title: "Ferretería Pardo SAS | 5.000+ Productos Ferreteros en Bogotá",
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
      "5.000+ productos de herrajes, cerrajería y herramientas. Cotiza por WhatsApp.",
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
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteJsonLd()) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <MiniCart />
      </body>
    </html>
  );
}
