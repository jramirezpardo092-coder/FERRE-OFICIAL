export interface Product {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  stock: number;
  cat: string;
  brand: string;
  original?: number | null;
  disc?: number | null;
  img?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export type Category = {
  name: string;
  slug: string;
  icon: string;
  count: number;
};

export type Brand = {
  name: string;
  slug: string;
  logo?: string;
};
