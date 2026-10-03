export type ProductImage = {
  src: string;
  alt?: string;
  verified: true;
};

export type ProductSpec = {
  label: string;
  value: string;
  verified: true;
};

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
  gallery?: ProductImage[];
  specs?: ProductSpec[];
  ref?: string;
  sku?: string;
  tags?: string[];
  taxRate?: number;
  priceVerified?: boolean;
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
