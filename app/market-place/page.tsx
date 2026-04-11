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
  const MAX_PRODUCTS_PER_BATCH = 10;
  const router = useRouter();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [visibleCountByCategory, setVisibleCountByCategory] = useState<
    Record<string, number>
  >({});
  const [categoryThumbnails, setCategoryThumbnails] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("seller_products")
          .select("*")
          .eq("status", "approved")
          .order("category_id", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("socialmedia_account_category")
          .select("id, name, thumbnail_url"),
      ]);

      if (productsRes.error) {
        setError("Failed to load products");
        return;
      }

      const rawProducts = productsRes.data || [];
      const productIds = rawProducts.map((p) => p.id);

      let merged: SellerProduct[] = [];

      if (productIds.length > 0) {
        const attachCounts = (
          rows: typeof rawProducts,
          getCount: (productId: number) => number,
        ): SellerProduct[] =>
          rows
            .map((p) => {
              const n = p as SellerProduct;
              const available = getCount(n.id);
              return {
                ...n,
                seller_product_accounts: [{ count: available }],
              };
            })
            .filter((p) => (p.seller_product_accounts?.[0]?.count ?? 0) > 0);

        let loaded = false;

        const { data: stockRows, error: rpcError } = await supabase.rpc(
          "marketplace_available_counts",
          { p_ids: productIds },
        );

        if (!rpcError && stockRows) {
          const countByProduct = new Map<number, number>();
          for (const row of stockRows) {
            const r = row as { product_id: number; available_count: number };
            countByProduct.set(
              Number(r.product_id),
              Number(r.available_count ?? 0),
            );
          }
          merged = attachCounts(rawProducts, (id) => countByProduct.get(id) ?? 0);
          loaded = true;
        } else {
          console.warn("marketplace_available_counts:", rpcError?.message ?? rpcError);
        }

        if (!loaded) {
          const { data: embedRows, error: embedError } = await supabase
            .from("seller_products")
            .select("*, seller_product_accounts(count)")
            .eq("status", "approved")
            .is("seller_product_accounts.buyer_id", null)
            .order("category_id", { ascending: true })
            .order("created_at", { ascending: false });

          if (!embedError && embedRows != null) {
            merged = embedRows
              .map((p) => {
                const row = p as SellerProduct & {
                  seller_product_accounts?: { count?: number }[];
                };
                const c = row.seller_product_accounts?.[0]?.count ?? 0;
                return {
                  ...row,
                  seller_product_accounts: [{ count: c }],
                };
              })
              .filter((p) => (p.seller_product_accounts?.[0]?.count ?? 0) > 0);
            loaded = true;
          } else {
            console.warn("filtered embed count:", embedError?.message ?? embedError);
          }
        }

        if (!loaded) {
          const { data: availRows, error: availError } = await supabase
            .from("seller_product_accounts")
            .select("product_id")
            .in("product_id", productIds)
            .is("buyer_id", null);

          if (!availError && availRows) {
            const countByProduct = new Map<number, number>();
            for (const r of availRows) {
              const pid = Number((r as { product_id: number }).product_id);
              countByProduct.set(pid, (countByProduct.get(pid) ?? 0) + 1);
            }
            merged = attachCounts(
              rawProducts,
              (id) => countByProduct.get(id) ?? 0,
            );
            loaded = true;
          } else {
            console.warn("seller_product_accounts bulk:", availError?.message ?? availError);
          }
        }

        if (!loaded) {
          setError(
            "Could not load product inventory. Check Supabase RLS for seller_product_accounts, or run client/marketplace_available_counts_migration.sql.",
          );
          setProducts([]);
          return;
        }
      }

      setProducts(merged);

      if (!categoriesRes.error && categoriesRes.data) {
        const map: Record<string, string> = {};
        for (const row of categoriesRes.data) {
          if (row.thumbnail_url) {
            map[String(row.id)] = row.thumbnail_url;
            if (row.name) {
              map[row.name] = row.thumbnail_url;
            }
          }
        }
        setCategoryThumbnails(map);
      }
    } catch {
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

  const handleSeeMore = (category: string) => {
    setVisibleCountByCategory((prev) => ({
      ...prev,
      [category]: (prev[category] || MAX_PRODUCTS_PER_BATCH) + MAX_PRODUCTS_PER_BATCH,
    }));
  };

  return (
    <div className="flex min-h-screen flex-col text-gray-900">
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
            {/*
              Show max 10 products per category initially.
              "See more" loads 10 additional products each click.
            */}
            {(() => {
              const visibleCount =
                visibleCountByCategory[category] || MAX_PRODUCTS_PER_BATCH;
              const visibleItems = items.slice(0, visibleCount);
              const hasMore = items.length > visibleCount;
              const categoryKey =
                visibleItems[0]?.category_id != null
                  ? String(visibleItems[0].category_id)
                  : category;

              return (
                <>
                  <TableCardHeader
                    title={category}
                    categoryThumbnailUrl={
                      categoryThumbnails[categoryKey] || categoryThumbnails[category]
                    }
                    products={visibleItems}
                    className="mt-8"
                    onBuyClick={handleBuyClick}
                  />
                  {hasMore && (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleSeeMore(category)}
                        className="rounded-full border border-[#194572] px-5 py-2 text-sm font-medium text-[#194572] transition hover:bg-[#194572] hover:text-white"
                      >
                        See more
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </AnimatedSection>
        ))}
      <div className="my-10" />

      <SocialMediaAcquisition />
      <Footer />
      <WarningModal />
    </div>
  );
}
