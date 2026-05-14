// Tipos base de Vitalora — se ampliarán al conectar Supabase

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: "cosmeticos" | "suplementos";
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado";
  createdAt: string;
}
