/**
 * Botanical Woodcraft Product and Inventory Type Definitions
 */

export type ProductCategory = "plant" | "care" | "woodcraft" | "tool" | "pot";

export interface Product {
  id: number;
  ID?: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  image_url?: string;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilterParams {
  category?: ProductCategory;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
