export interface SellerProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  category_id: number | null;
  price: number;
  created_at: string;
  seller_product_accounts?: {
    count: number;
  }[];
}
