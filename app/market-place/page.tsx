"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Footer from "../components/Footer";
import Navbar1 from "../components/Navbar1";
import SocialMediaAcquisition from "../components/SocialMediaAcquisition";
import TableCardHeader from "../components/TableCardHeader";
import TopBar from "../components/TopBar";
import WarningModal from "../components/WarningModal";
import { supabase } from "@/lib/supabaseClient";
import { SellerProduct } from "@/types/callabelTypes";

const Navbar2 = dynamic(() => import("../components/Navbar2"), { ssr: false });



export default function MarketPlace() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("seller_products")
        .select(`*, seller_product_accounts(count)`)
        .eq("status", "approved")
        .order("category_id", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to load products");
        return;
      }

      setProducts(data || []);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // ✅ GROUP BY CATEGORY
  const groupedProducts = products.reduce<Record<string, SellerProduct[]>>(
    (acc, product) => {
      const categoryName = product.category || "Uncategorized";

      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }

      acc[categoryName].push(product);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={() => {}} />

      {loading && (
        <div className="flex justify-center py-10 text-gray-500">
          Loading products...
        </div>
      )}

      {error && (
        <div className="flex justify-center py-10 text-red-500">{error}</div>
      )}

      {!loading &&
        !error &&
        Object.entries(groupedProducts).map(([category, items]) => (
          <TableCardHeader
            key={category}
            title={category}
            products={items}
            className="mt-8"
          />
        ))}

      <SocialMediaAcquisition />
      <Footer />
      <WarningModal />
    </div>
  );
}
