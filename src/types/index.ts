export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  image: string;
  stockQuantity: number;
  inStock: boolean;
  features: string[];
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}
