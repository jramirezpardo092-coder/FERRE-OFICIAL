export const SITE = {
  name: "Ferretería Pardo SAS",
  tagline: "Desde 1966",
  description: "Herrajes, cerrajería, herramientas y tornillería. 60+ años de experiencia en Bogotá.",
  url: ((typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) || "https://ferre-oficial.vercel.app").replace(/\/$/, ""),
  phone1: "3208345756",
  phone2: "3118486132",
  phone1Display: "320 834 5756",
  phone2Display: "311 848 6132",
  email: "ferrepardo@gmail.com",
  address: "Calle 72 No. 50-23, Bogotá · Barrio 12 de Octubre",
  hours: {
    weekdays: "Lunes a jueves: 8:15 AM – 4:45 PM",
    friday: "Viernes: 8:15 AM – 4:30 PM",
    saturday: "Sábados: 8:15 AM – 1:00 PM",
    sunday: "Domingos y festivos: Cerrado",
  },
  social: {
    instagram: "https://www.instagram.com/ferreteriapardo/",
    facebook: "https://www.facebook.com/ferreteriapardosas",
    whatsapp: "https://wa.me/573118486132?text=Hola%2C+vi+el+cat%C3%A1logo+en+la+p%C3%A1gina+y+quiero+cotizar",
  },
  payments: ["Efectivo", "Transferencia bancaria", "Nequi", "Daviplata", "Tarjeta débito/crédito"],
  mapEmbed: "https://maps.google.com/maps?q=Ferreter%C3%ADa%20Pardo%2C%20Calle%2072%2050-23%2C%20Bogot%C3%A1&output=embed",
  mapDirections: "https://www.google.com/maps/dir/?api=1&destination=Ferreter%C3%ADa%20Pardo%2C%20Calle%2072%2050-23%2C%20Bogot%C3%A1",
};

export const CATEGORIES = [
  { name: "Cerrajería", slug: "cerrajeria", icon: "🔐" },
  { name: "Ferretería General", slug: "ferreteria-general", icon: "🔧" },
  { name: "Herramientas", slug: "herramientas", icon: "🛠️" },
  { name: "Herrajes para Muebles", slug: "herrajes-para-muebles", icon: "🚪" },
  { name: "Tornillería y Fijación", slug: "tornilleria-y-fijacion", icon: "🔩" },
  { name: "Adhesivos y Sellantes", slug: "adhesivos-y-sellantes", icon: "🧴" },
  { name: "Eléctrico", slug: "electrico", icon: "⚡" },
  { name: "Fontanería", slug: "fontaneria", icon: "🚿" },
  { name: "Seguridad Industrial", slug: "seguridad-industrial", icon: "🦺" },
];

export const BRANDS = [
  "YALE", "STANLEY", "DEWALT", "MAKITA", "BOSCH",
  "TRUPER", "PRETUL", "TOTAL", "KL", "MHA",
  "IRWIN", "QUALITA", "FLEXON", "BAHCO", "VERA",
  "FERRETERÍA PARDO",
];

export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Categorías", href: "/#categorias", hasDropdown: true },
  { label: "Marcas", href: "/marcas" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Contacto", href: "/contacto" },
];
