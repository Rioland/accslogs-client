"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar1 from "@/app/components/Navbar1";
import Navbar2 from "@/app/components/Navbar2";
import TopBar from "@/app/components/TopBar";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import { SellerProduct } from "@/types/callabelTypes";
import ProductCheckoutCard from "@/app/components/ProductCheckoutCard";

export default function ClientProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<SellerProduct | null>(null);
  const [availableStock, setAvailableStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId = params?.id ? Number(params.id) : null;

  useEffect(() => {
    if (productId) {
      fetchProductDetails(productId);
    }
  }, [productId]);

  const fetchProductDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product details
      const { data, error: productError } = await supabase
        .from("seller_products")
        .select("*")
        .eq("id", id)
        .single();

      if (productError) {
        setError("Failed to load product details");
        return;
      }

      setProduct(data);

      // Count only unassigned accounts (buyer_id is null = available stock)
      const { count, error: stockError } = await supabase
        .from("seller_product_accounts")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id)
        .is("buyer_id", null);

      if (!stockError) {
        setAvailableStock(count ?? 0);
      }
    } catch {
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  if (!productId) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <Navbar1 />
        <div className="flex justify-center py-10 text-gray-500">
          Invalid product ID
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 />

      {loading && (
        <div className="flex justify-center py-10 text-gray-500 flex-1">
          Loading product details...
        </div>
      )}

      {error && (
        <div className="flex justify-center py-10 text-red-500">{error}</div>
      )}

      {!loading && !error && product && (
        <div className="container mx-auto px-4 py-8 flex-1">
          <ProductCheckoutCard
            productId={product.id}
            title={product.name}
            price={product.price}
            stock={availableStock}
            description={product.description}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
