export interface SellerProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  category_id: number | null;
  price: number;
  created_at: string;
  seller_product_accounts?: {
    count: number;
  }[];
}
