"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";
import Navbar1 from "../components/Navbar1";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer";
import BillPaymentsPromo from "../components/BillPaymentsPromo";
import supabaseClient from "@/lib/supabaseClient";

const tabs = [
  { key: "home", label: "home" },
  { key: "add-funds", label: "add funds" },
  { key: "my-orders", label: "my orders" },
  { key: "tickets", label: "tickets" },
  { key: "transaction-history", label: "transaction history" },
  { key: "balance-history", label: "balance history" },
];

export default function DashboardPage() {
  const [activeKey, setActiveKey] = useState<string>(tabs[0].key);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [openTicketCount, setOpenTicketCount] = useState<number>(0);
  const [closedTicketCount, setClosedTicketCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();
      if (userError || !user) return;

      // Fetch user profile for display name
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        const name = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");
        setUserName(name || user.email || "");
      }

      // Fetch real order count for current user
      const { count: orders } = await supabaseClient
        .from("product_orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setOrderCount(orders ?? 0);

      // Fetch open tickets count
      const { count: openCount } = await supabaseClient
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["open", "in_progress"]);

      setOpenTicketCount(openCount ?? 0);

      // Fetch closed tickets count
      const { count: closedCount } = await supabaseClient
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "closed");

      setClosedTicketCount(closedCount ?? 0);
    };

    fetchDashboardData();
  }, []);

  const handleChange = async (key: string) => {
    if (key === "sign-out") {
      await supabaseClient.auth.signOut();
      router.push("/login");
    } else {
      setActiveKey(key);
    }
  };

  return (
    <div className="min-h-screen bg-[#e4e9ee] text-foreground">
      <TopBar />
      <Navbar1 />

      {/* Top bar for mobile with menu toggle */}

      <div className="md:hidden sticky top-0 z-30 bg-[#e4e9ee]/80 backdrop-blur supports-[backdrop-filter]:bg-[#e4e9ee]/60">
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
            Dashboard
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto flex gap-6 py-4 md:py-6 px-4 md:px-6">
        {/* Sidebar: desktop static */}
        <div className="hidden md:block md:shrink-0">
          <Sidebar activeKey={activeKey} onChange={handleChange} />
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
                    activeKey={activeKey}
                    onChange={(key) => {
                      handleChange(key);
                      setMobileOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content column */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Hello, {userName || "…"}
          </h1>

          <BillPaymentsPromo />

          <div className="rounded-xl border border-gray-200 bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-4 md:p-5 lg:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-[#F87D1F] font-semibold">
                Hello, {userName || "…"}!
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Promotional Emails
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:block after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow after:transition peer-checked:bg-[#F87D1F]" />
                </label>
              </div>
            </div>

            {/* Stat cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Orders",
                  icon: "🛒",
                  value: orderCount,
                  href: "/dashboard/my-orders",
                },
                {
                  title: "Open Tickets",
                  icon: "🎟️",
                  value: openTicketCount,
                  href: "/dashboard/tickets",
                },
                {
                  title: "Closed Tickets",
                  icon: "✔️",
                  value: closedTicketCount,
                  href: "/dashboard/tickets",
                },
              ].map((c) => (
                <a
                  key={c.title}
                  href={c.href}
                  className="rounded-xl border border-[#F87D1F]/30 bg-white p-5 md:p-6 shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] transition-shadow"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-[#F87D1F]">
                    <div className="text-2xl md:text-3xl" aria-hidden>
                      {c.icon}
                    </div>
                    <div className="font-semibold text-gray-800">{c.title}</div>
                    <div className="text-xl md:text-2xl font-bold">
                      {c.value}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
