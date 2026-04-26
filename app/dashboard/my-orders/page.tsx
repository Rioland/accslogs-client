"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, Eye, EyeOff, Package, ShoppingCart } from "lucide-react";
import Sidebar from "../Sidebar";
import TopBar from "@/app/components/TopBar";
import Navbar1 from "@/app/components/Navbar1";
import Footer from "@/app/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

const Navbar2 = dynamic(() => import("@/app/components/Navbar2"), {
  ssr: false,
});

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface PurchasedAccount {
  id: number;
  username: string;
  password: string;
  email: string | null;
  email_password: string | null;
  additional_info: string | null;
  preview_link: string | null;
}

interface Order {
  id: number;
  product_id: number;
  quantity: number;
  grand_total: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  created_at: string;
  seller_products: {
    name: string;
    price: number;
    category: string;
  } | null;
  accounts: PurchasedAccount[];
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                 */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    completed: "bg-green-100 text-green-700 border-green-300",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    cancelled: "bg-red-100 text-red-700 border-red-300",
    refunded: "bg-blue-100 text-blue-700 border-blue-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Single order card                                                   */
/* ------------------------------------------------------------------ */

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<number, boolean>
  >({});

  const togglePassword = (id: number) =>
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Order header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Order #{order.id}
            </p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order summary */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Product</p>
          <p className="font-medium text-gray-800 truncate">
            {order.seller_products?.name ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Category</p>
          <p className="font-medium text-gray-800 capitalize">
            {order.seller_products?.category ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
          <p className="font-medium text-gray-800">{order.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Total Paid</p>
          <p className="font-semibold text-green-600">
            ₦{Number(order.grand_total).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Purchased accounts (only for completed orders) */}
      {order.status === "completed" && order.accounts.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <span>
              View Purchased Account{order.accounts.length > 1 ? "s" : ""} (
              {order.accounts.length})
            </span>
            <span className="text-lg leading-none">{expanded ? "▲" : "▼"}</span>
          </button>

          {expanded && (
            <div className="px-5 pb-5 space-y-4">
              {order.accounts.map((acc, idx) => (
                <div
                  key={acc.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Account {idx + 1}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {/* Username */}
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Username</p>
                      <p className="font-mono font-medium text-gray-800 break-all">
                        {acc.username}
                      </p>
                    </div>

                    {/* Password */}
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Password</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium text-gray-800 break-all">
                          {visiblePasswords[acc.id] ? acc.password : "••••••••"}
                        </p>
                        <button
                          onClick={() => togglePassword(acc.id)}
                          className="shrink-0 text-gray-400 hover:text-gray-600"
                          aria-label="Toggle password visibility"
                        >
                          {visiblePasswords[acc.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    {acc.email && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                        <p className="font-mono font-medium text-gray-800 break-all">
                          {acc.email}
                        </p>
                      </div>
                    )}

                    {/* Email Password */}
                    {acc.email_password && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Email Password
                        </p>
                        <p className="font-mono font-medium text-gray-800 break-all">
                          {acc.email_password}
                        </p>
                      </div>
                    )}

                    {/* Preview Link */}
                    {acc.preview_link && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Preview Link
                        </p>
                        <a
                          href={acc.preview_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {acc.preview_link}
                        </a>
                      </div>
                    )}

                    {/* Additional Info */}
                    {acc.additional_info && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Additional Info
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {acc.additional_info}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending / no accounts message */}
      {order.status === "completed" && order.accounts.length === 0 && (
        <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
          Account details are being prepared. Please check back shortly.
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setFetchError(null);

    try {
      // getUser() validates the JWT; getSession() can be stale and mismatch RLS auth.uid()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Load orders only (avoids PostgREST embed quirks with RLS on joined tables)
      const { data: ordersData, error: ordersError } = await supabase
        .from("product_orders")
        .select("id, product_id, quantity, grand_total, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        setFetchError(
          `Failed to load orders: ${ordersError.message || "Please try again."}`,
        );
        return;
      }

      const rawOrders = ordersData ?? [];
      const productIds = [
        ...new Set(
          rawOrders.map((o) => o.product_id).filter(
            (id): id is number => id != null && Number.isFinite(Number(id)),
          ),
        ),
      ];

      // Batch-load product rows (same RLS as marketplace; * keeps compatibility if columns differ)
      const productById = new Map<
        number,
        { name: string; price: number; category: string }
      >();

      if (productIds.length > 0) {
        const { data: productRows, error: productsError } = await supabase
          .from("seller_products")
          .select("*")
          .in("id", productIds);

        if (productsError) {
          setFetchError(
            `Failed to load product details: ${productsError.message || "Please try again."}`,
          );
          return;
        }

        for (const row of productRows ?? []) {
          const r = row as {
            id: number;
            name: string;
            price: number;
            category?: string | null;
          };
          productById.set(r.id, {
            name: r.name,
            price: r.price,
            category: (r.category ?? "") as string,
          });
        }
      }

      // For each order, load purchased accounts (buyer = current user)
      const ordersWithAccounts: Order[] = await Promise.all(
        rawOrders.map(async (order) => {
          const { data: accounts, error: accErr } = await supabase
            .from("seller_product_accounts")
            .select(
              "id, username, password, email, email_password, additional_info, preview_link",
            )
            .eq("product_id", order.product_id)
            .eq("buyer_id", user.id);

          if (accErr) {
            console.error("seller_product_accounts", accErr.message);
          }

          const sp = productById.get(order.product_id);
          return {
            ...order,
            seller_products: sp
              ? {
                  name: sp.name,
                  price: sp.price,
                  category: sp.category,
                }
              : null,
            accounts: accounts ?? [],
          };
        }),
      );

      setOrders(ordersWithAccounts);
    } catch (e) {
      console.error(e);
      setFetchError("An unexpected error occurred.");
    } finally {
      setLoadingOrders(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSidebarChange = async (key: string) => {
    if (key === "sign-out") {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  const handleSelectCategory = () => {};

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />
      <Navbar2 onSelectCategory={handleSelectCategory} />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-backdrop-filter:bg-[#e4e9ee]/60">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm active:scale-[0.98]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
          <span className="text-base font-semibold text-gray-900">
            My Orders
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        {/* Sidebar: desktop */}
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey="my-orders" onChange={handleSidebarChange} />
        </div>

        {/* Sidebar: mobile off-canvas */}
        {mobileOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/40"
              aria-hidden
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] p-2">
              <div className="rounded-xl bg-white shadow-2xl ring-1 ring-black/10 h-full overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">
                    Menu
                  </span>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar
                    activeKey="my-orders"
                    onChange={(key) => {
                      handleSidebarChange(key);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-amber-500" />
              My Orders
            </h1>
            <Link
              href="/market-place"
              className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
            >
              Browse Marketplace →
            </Link>
          </div>

          {/* Loading */}
          {loadingOrders && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center gap-3 text-gray-500">
              <svg
                className="animate-spin h-8 w-8 text-amber-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <p className="text-sm">Loading your orders…</p>
            </div>
          )}

          {/* Error */}
          {!loadingOrders && fetchError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
              <p className="font-medium">{fetchError}</p>
              <button
                onClick={fetchOrders}
                className="mt-3 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loadingOrders && !fetchError && orders.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  No orders yet
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You haven&apos;t placed any orders. Browse the marketplace to
                  get started.
                </p>
              </div>
              <Link
                href="/market-place"
                className="inline-flex items-center gap-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 text-sm transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          )}

          {/* Orders list */}
          {!loadingOrders && !fetchError && orders.length > 0 && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] px-5 py-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Total Orders:</span>
                  <span className="font-semibold text-gray-800">
                    {orders.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Completed:</span>
                  <span className="font-semibold text-green-600">
                    {orders.filter((o) => o.status === "completed").length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Total Spent:</span>
                  <span className="font-semibold text-gray-800">
                    ₦
                    {orders
                      .reduce((sum, o) => sum + Number(o.grand_total), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order cards */}
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
