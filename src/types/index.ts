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
  /** Extra gallery images; only returned when a single product is fetched. */
  images?: string[];
  stockQuantity: number;
  inStock: boolean;
  features: string[];
  badge?: string;
  /** Shown in the storefront's "Deal of the day" carousel. */
  dealOfDay?: boolean;
  /** false = hidden from the storefront. */
  isActive?: boolean;
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
