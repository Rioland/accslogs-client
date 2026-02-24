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
        onSelectCategory={(category) => {
          console.log("Selected category:", category);
        }}
      />

      {!loading && !error && (
        <div className="bg-white shadow rounded-lg p-6 mx-4 mt-6">
          <h2 className="text-lg font-semibold mb-4">Filter Products</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

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
