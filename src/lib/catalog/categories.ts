import { CATEGORIES } from "../constants";

const introductions: Record<string, string> = {
  cerrajeria: "Encuentra cerraduras, candados y accesorios para puertas en Bogotá. Compara las referencias y consulta con nuestro equipo la compatibilidad y disponibilidad antes de cotizar.",
  "ferreteria-general": "Consulta accesorios y soluciones de ferretería para mantenimiento, reparación e instalación. Revisa las medidas y referencias de cada producto, y reúne lo que necesitas en una cotización.",
  herramientas: "Explora herramientas y accesorios para trabajos de taller, obra y mantenimiento. Busca por referencia o medida y solicita asesoría para elegir el producto adecuado para tu trabajo.",
  "herrajes-para-muebles": "Encuentra bisagras, rieles y herrajes para fabricar o reparar muebles. Verifica medidas, acabados y mecanismos disponibles, y consulta la compatibilidad con tu proyecto.",
  "tornilleria-y-fijacion": "Consulta tornillos y elementos de fijación para tus instalaciones. Busca por medida, referencia y material; nuestro equipo puede ayudarte a confirmar la aplicación antes de cotizar.",
  "adhesivos-y-sellantes": "Explora adhesivos y sellantes para reparación e instalación. Revisa la referencia y consulta su compatibilidad con la superficie y las condiciones de tu trabajo.",
  electrico: "Encuentra accesorios eléctricos para mantenimiento e instalación. Consulta las características de cada referencia y confirma con nuestro equipo lo que necesita tu proyecto.",
  fontaneria: "Consulta accesorios de fontanería para conexiones, reparación y mantenimiento. Comprueba las medidas de cada referencia y solicita asesoría para completar tu cotización.",
  "seguridad-industrial": "Explora elementos de seguridad industrial para tu trabajo. Consulta las referencias disponibles y confirma con nuestro equipo las características que requiere tu actividad.",
};
export const CATALOG_CATEGORIES = CATEGORIES.map((category) => ({ ...category, introduction: introductions[category.slug] }));
