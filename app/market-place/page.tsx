/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Footer from "../components/Footer";
import Navbar1 from "../components/Navbar1";
import SocialMediaAcquisition from "../components/SocialMediaAcquisition";
import TableCardHeader from "../components/TableCardHeader";
import TopBar from "../components/TopBar";
import WarningModal from "../components/WarningModal";
import { supabase } from "@/lib/supabaseClient";

const Navbar2 = dynamic(() => import("../components/Navbar2"), { ssr: false });

// Type for seller product
interface SellerProduct {
  id: number;
  category: string;
  subcategory: string | null;
  name: string;
  description: string | null;
  price: number;
  release_option: string;
  status: string;
  created_at: string;
}

// Type for transformed product display
// interface AccountProduct {
//   year: number | string;
//   description: string;
//   stock: number;
//   price: number;
//   isNoPhone?: boolean;
//   hasBackupEmail?: boolean;
//   isSmsVerified?: boolean;
//   genderMention?: 'Male or female' | string;
// }

export default function MarketPlace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectCategory = (category: any, subcategory: any) => {
    console.log("Selected:", category, subcategory);
  };

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch approved seller products with account count
      const { data, error: fetchError } = await supabase
        .from("seller_products")
        .select(`
          *,
          seller_product_accounts(count)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching seller products:", fetchError);
        // Fallback: try without account count
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("seller_products")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (fallbackError) {
          setError("Failed to load products");
          return;
        }

        const transformedProducts: any[] = (fallbackData || []).map((product: SellerProduct) => {
          const createdYear = new Date(product.created_at).getFullYear();
          return {
            year: createdYear,
            description: product.description || product.name,
            stock: 1,
            price: product.price,
            isNoPhone: false,
            hasBackupEmail: true,
            isSmsVerified: false,
            genderMention: "Male or female" as const
          };
        });

        setProducts(transformedProducts);
        setLoading(false);
        return;
      }

      // Transform data to match AccountProduct interface
      const transformedProducts: any[] = (data || []).map((product: any) => {
        const createdYear = new Date(product.created_at).getFullYear();
        const accountCount = product.seller_product_accounts?.[0]?.count || 1;
        
        return {
          year: createdYear,
          description: product.description || product.name,
          stock: accountCount,
          price: product.price,
          isNoPhone: false,
          hasBackupEmail: true,
          isSmsVerified: false,
          genderMention: "Male or female" as const
        };
      });

      setProducts(transformedProducts);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />
      
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="text-gray-500">Loading products...</div>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center py-10">
          <div className="text-red-500">{error}</div>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="flex justify-center items-center py-10">
          <div className="text-gray-500">No products available at the moment.</div>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {products.map((product, index) => (
            <TableCardHeader 
              key={index}
              title={product.category} 
              products={[product]} 
              className="mt-6" 
            />
          ))}
        </>
      )}

      <SocialMediaAcquisition />
      <Footer />
      <WarningModal />
    </div>
  );
}

