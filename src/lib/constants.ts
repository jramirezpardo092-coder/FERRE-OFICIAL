export const SITE = {
  name: "Ferretería Pardo SAS",
  tagline: "Desde 1966",
  description: "Herrajes, cerrajería, herramientas y tornillería. 60+ años de experiencia en Bogotá.",
  url: "https://ferre-oficial.vercel.app",
  phone1: "3208345756",
  phone2: "3118486132",
  phone1Display: "320 834 5756",
  phone2Display: "311 848 6132",
  email: "ferrepardo@gmail.com",
  address: "Calle 72 No. 50-23, Bogotá · Barrio 12 de Octubre",
  hours: {
    weekdays: "Lunes a Viernes: 8:15 AM – 4:55 PM",
    saturday: "Sábados: 8:15 AM – 2:15 PM",
    sunday: "Domingos y festivos: Cerrado",
  },
  social: {
    instagram: "https://www.instagram.com/ferreteriapardo/",
    facebook: "https://www.facebook.com/ferreteriapardosas",
    whatsapp: "https://wa.me/573118486132?text=Hola%2C+vi+el+cat%C3%A1logo+en+la+p%C3%A1gina+y+quiero+cotizar",
  },
  payments: ["Efectivo", "Transferencia bancaria", "Nequi", "Daviplata", "Tarjeta débito/crédito"],
  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.686!2d-74.078!3d4.667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCalle+72+No.+50-23%2C+Bogot%C3%A1!5e0!3m2!1ses!2sco!4v1",
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
  "TRUPER", "PRETUL", "TOTAL", "KL", "MHA", "FERRETERÍA PARDO",
];

export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Categorías", href: "#categorias", hasDropdown: true },
  { label: "Marcas", href: "/marcas" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Contacto", href: "/contacto" },
];
