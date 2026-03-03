"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import Navbar1 from "../components/Navbar1";
import SocialMediaAcquisition from "../components/SocialMediaAcquisition";
import TableCardHeader from "../components/TableCardHeader";
import TopBar from "../components/TopBar";
import WarningModal from "../components/WarningModal";
import AnimatedSection from "../components/AnimatedSection";
import { supabase } from "@/lib/supabaseClient";
import { SellerProduct } from "@/types/callabelTypes";

const Navbar2 = dynamic(() => import("../components/Navbar2"), { ssr: false });

export default function MarketPlace() {
  const router = useRouter();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  useEffect(() => {
    // Update subcategories when category changes
    if (selectedCategory) {
      const filteredSubs = Array.from(
        new Set(
          products
            .filter((p) => p.category === selectedCategory)
            .map((p) => p.subcategory)
            .filter(Boolean),
        ),
      ) as string[];
      setSubcategories(filteredSubs);
      setSelectedSubcategory(""); // Reset subcategory when category changes
    } else {
      const uniqueSubcategories = Array.from(
        new Set(products.map((p) => p.subcategory).filter(Boolean)),
      ) as string[];
      setSubcategories(uniqueSubcategories);
    }
  }, [selectedCategory, products]);

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

      // Extract unique categories and subcategories
      const uniqueCategories = Array.from(
        new Set(data?.map((p) => p.category).filter(Boolean)),
      ) as string[];
      setCategories(uniqueCategories);

      const uniqueSubcategories = Array.from(
        new Set(data?.map((p) => p.subcategory).filter(Boolean)),
      ) as string[];
      setSubcategories(uniqueSubcategories);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selected category and subcategory
  const filteredProducts = products.filter((product) => {
    if (selectedCategory && product.category !== selectedCategory) return false;
    if (selectedSubcategory && product.subcategory !== selectedSubcategory)
      return false;
    return true;
  });

  // Handle buy button click - redirect to product detail page
  const handleBuyClick = (productId: number) => {
    router.push(`/market-place/${productId}`);
  };

  // ✅ GROUP BY CATEGORY
  const groupedProducts = filteredProducts.reduce<
    Record<string, SellerProduct[]>
  >((acc, product) => {
    const categoryName = product.category || "Uncategorized";

    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }

    acc[categoryName].push(product);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Navbar1 />
      <Navbar2
        onSelectCategory={(category, subcategory) => {
          setSelectedCategory(category.name);
          setSelectedSubcategory(subcategory?.name || "");
        }}
      />

      {loading && (
        <div className="flex justify-center py-10 text-gray-500 flex-1">
          Loading products...
        </div>
      )}

      {error && (
        <div className="flex justify-center py-10 text-red-500">{error}</div>
      )}

      {!loading &&
        !error &&
        Object.entries(groupedProducts).map(([category, items], index) => (
          <AnimatedSection
            key={category}
            animation="fade-up"
            delay={
              index < 6 ? ([0, 100, 200, 300, 400, 500] as const)[index] : 0
            }
          >
            <TableCardHeader
              title={category}
              products={items}
              className="mt-8"
              onBuyClick={handleBuyClick}
            />
          </AnimatedSection>
        ))}
      <div className="my-10" />

      <SocialMediaAcquisition />
      <Footer />
      <WarningModal />
    </div>
  );
}
